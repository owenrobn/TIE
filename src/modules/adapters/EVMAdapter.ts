// EVMAdapter.ts
import { ChainAdapter } from './ChainAdapter';
import { ethers } from 'ethers';
import { v4 as generateUuid } from 'uuid';

/**
 * Represents a normalized blockchain event.
 */
interface NormalizedEvent {
  chainId: string;
  blockNumber: number;
  txHash: string;
  contractAddress: string;
  eventName: string;
  decodedArgs: { [key: string]: any };
  timestamp: number; // Unix timestamp in milliseconds
}

export class EVMAdapter extends ChainAdapter {
  private provider: ethers.Provider;
  private etherscanApiKey: string;
  private wsRpcUrl: string | undefined;

  // Internal state for managing subscriptions and polling
  private blockListener: ((blockNumber: number) => Promise<void>) | null = null;
  private allEventListener: ((log: ethers.EventLog) => Promise<void>) | null = null;
  private filteredEventListeners: Map<string, (log: ethers.EventLog) => Promise<void>> = new Map();

  private eventPollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private lastProcessedBlockNumbers: Map<string, number> = new Map();
  private eventPollingRate = 5000; // Poll every 5 seconds for JSON-RPC

  constructor(rpcUrl: string, chainId: string, etherscanApiKey: string, wsRpcUrl?: string) {
    super(rpcUrl, chainId);
    this.etherscanApiKey = etherscanApiKey;
    this.wsRpcUrl = wsRpcUrl;

    if (this.wsRpcUrl) {
      try {
        this.provider = new ethers.WebSocketProvider(this.wsRpcUrl);
        console.log(`EVMAdapter initialized for chain ${this.chainId} with WebSocket RPC: ${this.wsRpcUrl}`);
      } catch (error) {
        console.warn(`Failed to connect to WebSocket RPC ${this.wsRpcUrl}. Falling back to JSON-RPC.`, error);
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        console.log(`EVMAdapter initialized for chain ${this.chainId} with JSON-RPC: ${this.rpcUrl}`);
      }
    } else {
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
      console.log(`EVMAdapter initialized for chain ${this.chainId} with JSON-RPC: ${this.rpcUrl}`);
    }
  }

  /**
   * Verifies the connection to the blockchain.
   * @returns A promise that resolves when connected, or rejects on failure.
   */
  async connect(): Promise<void> {
    try {
      await this.provider.getNetwork();
      console.log(`EVMAdapter connected to chain ${this.chainId}`);
    } catch (error) {
      console.error(`Failed to connect to chain ${this.chainId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves the current block number of the connected chain.
   * @returns A promise that resolves with the current block number.
   */
  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber();
    } catch (error) {
      console.error(`Failed to get block number on ${this.chainId}:`, error);
      throw error;
    }
  }

  /**
   * Subscribes to new blocks on the blockchain.
   * This method starts a continuous subscription and does not return a cleanup function,
   * as per the ChainAdapter abstract class signature.
   * @param callback The function to call with each new block.
   */
  subscribeBlocks(callback: (block: any) => void): void {
    if (this.blockListener) {
      this.provider.off('block', this.blockListener);
    }
    console.log(`Subscribing to blocks on ${this.chainId}`);
    this.blockListener = async (blockNumber: number) => {
      try {
        const block = await this.provider.getBlock(blockNumber);
        if (block) {
          callback(block);
        }
      } catch (error) {
        console.error(`Error fetching block ${blockNumber}:`, error);
      }
    };
    this.provider.on('block', this.blockListener);
  }

  /**
   * Subscribes to all new events on the blockchain.
   * Normalizes events into a standard format.
   * This method starts a continuous subscription and does not return a cleanup function,
   * as per the ChainAdapter abstract class signature.
   * @param callback The function to call with each new normalized event.
   */
  subscribeEvents(callback: (event: NormalizedEvent) => void): void {
    const subscriptionId = 'all-events'; // Fixed ID for the general subscription

    // Clear any previous 'all-events' subscription
    if (this.allEventListener) {
      this.provider.off('event', this.allEventListener);
    }
    this.stopEventPolling(subscriptionId);

    if (this.provider instanceof ethers.WebSocketProvider) {
      console.log(`Subscribing to all contract events on ${this.chainId} via WebSocket.`);
      this.allEventListener = async (log: ethers.EventLog) => {
        try {
          const block = await this.provider.getBlock(log.blockNumber);
          const timestamp = block ? block.timestamp * 1000 : Date.now();

          let eventName = 'UnknownEvent';
          let decodedArgs: { [key: string]: any } = {};

          const abi = await this.getContractABI(log.address);
          if (abi && abi.length > 0) {
            const decoded = this.decodeEventLog(log, abi);
            if (decoded) {
              eventName = decoded.eventName;
              decodedArgs = decoded.decodedArgs;
            }
          }

          const normalizedEvent: NormalizedEvent = {
            chainId: this.chainId,
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
            contractAddress: log.address,
            eventName,
            decodedArgs,
            timestamp
          };
          callback(normalizedEvent);
        } catch (error) {
          console.error(`Error processing WebSocket event log for ${subscriptionId}:`, error);
        }
      };
      this.provider.on('event', this.allEventListener);
    } else {
      console.log(`Starting polling for all events on ${this.chainId} (JSON-RPC).`);
      this.startEventPolling(subscriptionId, callback);
    }
  }

  /**
   * Subscribes to new events matching a specific filter on the blockchain.
   * Normalizes events into a standard format.
   * @param filter The filter object for logs (e.g., { address: '0x...', topics: [...] }).
   * @param callback The function to call with each new normalized event.
   * @returns A function to unsubscribe from filtered events.
   */
  subscribeToLogs(filter: ethers.Filter, callback: (event: NormalizedEvent) => void): () => void {
    const subscriptionId = generateUuid(); // Unique ID for this filtered subscription

    if (this.provider instanceof ethers.WebSocketProvider) {
      console.log(`Subscribing to filtered events on ${this.chainId} via WebSocket with filter:`, filter);
      const listener = async (log: ethers.EventLog) => {
        try {
          const block = await this.provider.getBlock(log.blockNumber);
          const timestamp = block ? block.timestamp * 1000 : Date.now();

          let eventName = 'UnknownEvent';
          let decodedArgs: { [key: string]: any } = {};

          const abi = await this.getContractABI(log.address);
          if (abi && abi.length > 0) {
            const decoded = this.decodeEventLog(log, abi);
            if (decoded) {
              eventName = decoded.eventName;
              decodedArgs = decoded.decodedArgs;
            }
          }

          const normalizedEvent: NormalizedEvent = {
            chainId: this.chainId,
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
            contractAddress: log.address,
            eventName,
            decodedArgs,
            timestamp
          };
          callback(normalizedEvent);
        } catch (error) {
          console.error(`Error processing filtered WebSocket event log for ${subscriptionId}:`, error);
        }
      };
      this.provider.on(filter, listener);
      this.filteredEventListeners.set(subscriptionId, listener); // Store listener with unique ID
      return () => {
        this.provider.off(filter, listener);
        this.filteredEventListeners.delete(subscriptionId);
        console.log(`Unsubscribed from filtered events on ${this.chainId} with filter:`, filter);
      };
    } else {
      console.log(`Starting polling for filtered events on ${this.chainId} (JSON-RPC) with filter:`, filter);
      this.startEventPolling(subscriptionId, callback, filter);
      return () => {
        this.stopEventPolling(subscriptionId);
        console.log(`Stopped polling for filtered events on ${this.chainId} with filter:`, filter);
      };
    }
  }

  /**
   * Fetches the ABI for a given contract address from an Etherscan-like API.
   * @param address The contract address.
   * @returns A promise that resolves with the contract's ABI as an array of objects.
   */
  async getContractABI(address: string): Promise<any[]> {
    console.log(`Fetching ABI for contract ${address} on ${this.chainId} from Etherscan-like API`);
    
    const etherscanBaseUrls: { [key: string]: string } = {
      '11155111': 'https://api-sepolia.etherscan.io/api', // Ethereum Sepolia
      '421614': 'https://api-sepolia.arbiscan.io/api',   // Arbitrum Sepolia
      '11155420': 'https://api-sepolia.optimistic.etherscan.io/api', // Optimism Sepolia
      '84532': 'https://api-sepolia.basescan.org/api',   // Base Sepolia
      // Add other chain IDs and their Etherscan-like URLs as needed
    };

    const baseUrl = etherscanBaseUrls[this.chainId];

    if (!baseUrl) {
      console.warn(`No Etherscan-like API URL configured for chainId: ${this.chainId}. Returning empty ABI.`);
      return [];
    }

    try {
      const url = `${baseUrl}?module=contract&action=getabi&address=${address}&apikey=${this.etherscanApiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return JSON.parse(data.result) as any[];
      } else {
        console.error(`Failed to fetch ABI for ${address}: ${data.result}`);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching ABI for ${address}:`, error);
      return [];
    }
  }

  /**
   * Fetches the native token balance for a given address.
   * @param address The wallet address.
   * @returns A promise that resolves with the balance as a string in ETH/native token units.
   */
  async getBalance(address: string): Promise<string> {
    console.log(`Fetching balance for ${address} on ${this.chainId}`);
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance); // Return balance in ETH/native token units
    } catch (error) {
      console.error(`Failed to fetch balance for ${address}:`, error);
      return "0";
    }
  }

  /**
   * Performs a preflight simulation of a transaction using `eth_call`.
   * @param txPayload The transaction request payload.
   * @returns A promise that resolves with the simulation result.
   */
  async simulateTransaction(txPayload: ethers.TransactionRequest): Promise<any> {
    console.log(`Performing preflight simulation (eth_call) on ${this.chainId} for transaction:`, txPayload);
    try {
      const result = await this.provider.call(txPayload);
      const gasEstimate = await this.provider.estimateGas(txPayload);
      return {
        success: true,
        gasUsed: gasEstimate.toString(),
        result: result,
        message: "Preflight simulation successful."
      };
    } catch (error: any) {
      console.error(`Preflight simulation failed on ${this.chainId}:`, error);
      return {
        success: false,
        gasUsed: "0",
        result: null,
        error: error.message || "Preflight simulation failed."
      };
    }
  }

  /**
   * Fetches current gas data for the chain.
   * @returns A promise that resolves with gas price, max fee per gas, and max priority fee per gas.
   */
  async fetchGasData(): Promise<any> {
    console.log(`Fetching gas data on ${this.chainId}`);
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice ? feeData.gasPrice.toString() : null,
        maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.toString() : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.toString() : null,
      };
    } catch (error) {
      console.error(`Failed to fetch gas data:`, error);
      return {
        gasPrice: "20000000000",    // 20 Gwei
        baseFee: "15000000000",      // 15 Gwei
        priorityFee: "5000000000"    // 5 Gwei
      };
    }
  }

  /**
   * Fetches blockchain state. This is a generic placeholder and its specific implementation
   * depends on the exact RPC method intended (e.g., `eth_getStorageAt`, `eth_getCode`, etc.).
   * @param query A string representing the state query (e.g., a contract address, a block hash).
   * @returns A promise that resolves with the state data.
   */
  async fetchState(query: string): Promise<any> {
    console.warn(`fetchState is a generic placeholder. Specific implementation for state queries is needed.`);
    try {
      // Example: If query is a contract address, fetch its code.
      if (query.startsWith('0x') && query.length === 42) {
        // Assume it's an address and fetch code
        const code = await this.provider.getCode(query);
        return { address: query, code };
      } else if (query.length === 66 && query.startsWith('0x')) {
        // Assume it's a block hash
        const block = await this.provider.getBlock(query);
        return { blockHash: query, block };
      } else if (!isNaN(parseInt(query))) {
        // Assume it's a block number
        const block = await this.provider.getBlock(parseInt(query));
        return { blockNumber: query, block };
      }
      // For now, return an empty object or throw an error for unsupported queries.
      return {};
    } catch (error) {
      console.error(`Failed to fetch state for query ${query}:`, error);
      throw error;
    }
  }

  /**
   * Fetches event logs based on a query.
   * @param query The log filter query.
   * @returns A promise that resolves with an array of raw log objects.
   */
  async fetchLogs(query: any): Promise<any[]> {
    console.log(`Fetching logs on ${this.chainId} with query:`, query);
    try {
      const logs = await this.provider.getLogs(query);
      return logs.map(log => ({
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        address: log.address,
        topics: log.topics,
        data: log.data,
      }));
    } catch (error) {
      console.error(`Failed to fetch logs:`, error);
      return [];
    }
  }

  /**
   * Sends a signed transaction to the network.
   * @param signedTx The RLP-encoded signed transaction string.
   * @returns A promise that resolves with the transaction hash and success status.
   */
  async sendTransaction(signedTx: string): Promise<{ hash: string; success: boolean; error?: string }> {
    console.log(`Sending signed transaction to ${this.chainId}`);
    try {
      const txResponse = await this.provider.broadcastTransaction(signedTx);
      await txResponse.wait(); // Wait for transaction to be mined
      console.log(`Transaction sent. Hash: ${txResponse.hash}`);
      return { hash: txResponse.hash, success: true };
    } catch (error: any) {
      console.error(`Failed to send transaction on ${this.chainId}:`, error);
      return { hash: '', success: false, error: error.message };
    }
  }

  /**
   * Decodes an event log using the contract's ABI.
   * @param log The raw event log from ethers.js.
   * @param abi The ABI of the contract.
   * @returns An object containing the event name and decoded arguments, or null if decoding fails.
   */
  private decodeEventLog(log: ethers.EventLog, abi: any[]): { eventName: string; decodedArgs: { [key: string]: any } } | null {
    try {
      const iface = new ethers.Interface(abi);
      const parsedLog = iface.parseLog(log);
      if (parsedLog) {
        return {
          eventName: parsedLog.name,
          decodedArgs: parsedLog.args.toObject(),
        };
      }
    } catch (error) {
      // console.warn(`Failed to decode event log for contract ${log.address}:`, error);
    }
    return null;
  }

  /**
   * Starts polling for events on JSON-RPC providers.
   * @param subscriptionId A unique ID for this subscription.
   * @param callback The callback function to receive normalized events.
   * @param filter Optional filter for logs.
   */
  private startEventPolling(subscriptionId: string, callback: (event: NormalizedEvent) => void, filter?: ethers.Filter): void {
    if (this.eventPollingIntervals.has(subscriptionId)) {
      clearInterval(this.eventPollingIntervals.get(subscriptionId)!);
    }
    const interval = setInterval(() => this.pollEvents(subscriptionId, callback, filter), this.eventPollingRate);
    this.eventPollingIntervals.set(subscriptionId, interval);
    console.log(`Started event polling for ${subscriptionId} on ${this.chainId} with interval ${this.eventPollingRate}ms.`);
  }

  /**
   * Stops polling for events for a specific subscription.
   * @param subscriptionId The ID of the subscription to stop.
   */
  private stopEventPolling(subscriptionId: string): void {
    if (this.eventPollingIntervals.has(subscriptionId)) {
      clearInterval(this.eventPollingIntervals.get(subscriptionId)!);
      this.eventPollingIntervals.delete(subscriptionId);
      this.lastProcessedBlockNumbers.delete(subscriptionId);
      console.log(`Stopped event polling for ${subscriptionId} on ${this.chainId}.`);
    }
  }

  /**
   * Polls for events within new blocks.
   * @param subscriptionId The ID of the subscription.
   * @param callback The callback function to receive normalized events.
   * @param filter Optional filter for logs.
   */
  private async pollEvents(subscriptionId: string, callback: (event: NormalizedEvent) => void, filter?: ethers.Filter): Promise<void> {
    try {
      const currentBlockNumber = await this.provider.getBlockNumber();
      let lastBlock = this.lastProcessedBlockNumbers.get(subscriptionId);

      if (lastBlock === undefined || lastBlock === null) {
        lastBlock = currentBlockNumber - 10; // Start from 10 blocks back or a configurable value
        if (lastBlock < 0) lastBlock = 0;
      }

      if (currentBlockNumber > lastBlock) {
        const logs = await this.provider.getLogs({
          fromBlock: lastBlock + 1,
          toBlock: currentBlockNumber,
          ...filter
        });

        for (const log of logs) {
          const block = await this.provider.getBlock(log.blockNumber);
          const timestamp = block ? block.timestamp * 1000 : Date.now();

          let eventName = 'UnknownEvent';
          let decodedArgs: { [key: string]: any } = {};

          const abi = await this.getContractABI(log.address);
          if (abi && abi.length > 0) {
            const decoded = this.decodeEventLog(log, abi);
            if (decoded) {
              eventName = decoded.eventName;
              decodedArgs = decoded.decodedArgs;
            }
          }

          const normalizedEvent: NormalizedEvent = {
            chainId: this.chainId,
            blockNumber: log.blockNumber,
            txHash: log.transactionHash,
            contractAddress: log.address,
            eventName,
            decodedArgs,
            timestamp
          };
          callback(normalizedEvent);
        }
        this.lastProcessedBlockNumbers.set(subscriptionId, currentBlockNumber);
      }
    } catch (error) {
      console.error(`Error polling events for ${subscriptionId} on ${this.chainId}:`, error);
    }
  }
}