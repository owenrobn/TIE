// EVMAdapter.ts
import { ChainAdapter } from './ChainAdapter';
import { ethers } from 'ethers';

export class EVMAdapter extends ChainAdapter {
  private provider: ethers.Provider; // Changed to generic Provider
  private etherscanApiKey: string;
  private wsRpcUrl: string | undefined; // New property for WebSocket RPC

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

  subscribeBlocks(callback: (block: any) => void): void {
    console.log(`Subscribing to blocks on ${this.chainId}`);
    this.provider.on('block', async (blockNumber: number) => {
      try {
        const block = await this.provider.getBlock(blockNumber);
        if (block) {
          callback(block);
        }
      } catch (error) {
        console.error(`Error fetching block ${blockNumber}:`, error);
      }
    });
  }

  subscribeEvents(callback: (event: any) => void): void {
    if (this.provider instanceof ethers.WebSocketProvider) {
      console.log(`Subscribing to all contract events on ${this.chainId} via WebSocket.`);
      // This will listen to ALL events emitted on the blockchain.
      // In a real application, you would typically filter for specific contract addresses or event topics.
      this.provider.on('event', (log: ethers.EventLog) => {
        callback({
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          address: log.address,
          topics: log.topics,
          data: log.data,
          logIndex: log.logIndex,
          eventName: log.eventName, // If ABI is known and event is parsed
          args: log.args, // If ABI is known and event is parsed
        });
      });
    } else {
      console.warn(`Cannot subscribe to real-time events on ${this.chainId}: No WebSocketProvider available. Use fetchLogs with polling instead.`);
      // Fallback for JSON-RPC provider: suggest polling fetchLogs
    }
  }

  async getContractABI(address: string): Promise<any> {
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
        return JSON.parse(data.result);
      } else {
        console.error(`Failed to fetch ABI for ${address}: ${data.result}`);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching ABI for ${address}:`, error);
      return [];
    }
  }

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

  async simulateTransaction(txPayload: ethers.TransactionRequest): Promise<any> {
    console.log(`Performing preflight simulation (eth_call) on ${this.chainId} for transaction:`, txPayload);
    try {
      const result = await this.provider.call(txPayload);
      // If call succeeds, it means the transaction would likely not revert
      // We can also try to estimate gas to see if it's a valid transaction
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

  async fetchGasData(): Promise<any> {
    console.log(`Fetching gas data on ${this.chainId}`);
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice ? feeData.gasPrice.toString() : null,
        maxFeePerGas: feeData.maxFeePerGas ? feeData.maxFeePerGas.toString() : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? feeData.maxPriorityFeePerGas.toString() : null,
        // Convert to Gwei for easier reading if needed, but keep as string for consistency
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

  async fetchState(slotOrBlock: string): Promise<any> {
    // Implementation for fetching blockchain state (e.g., storage at a specific slot)
    console.log(`Fetching state ${slotOrBlock} on ${this.chainId} (simulated)`);
    // This method is highly specific and depends on the exact RPC method (e.g., `eth_getStorageAt`).
    // For now, it remains a placeholder.
    return {}; // Return empty state for demo
  }

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
}