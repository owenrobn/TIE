// InteractionEngine.ts
import { EVMAdapter } from '../adapters/EVMAdapter';
import { ethers } from 'ethers'; // Import ethers for Wallet and TransactionRequest

interface InteractionResult {
  success: boolean;
  txHash?: string;
  gasUsed?: number;
  error?: string;
  logs?: any[];
  output?: any;
}

export class InteractionEngine {
  private chainAdapters: Map<string, EVMAdapter>; // Map of chainId to EVMAdapter
  private antiSybilEngine: any; // Assuming AntiSybilEngine is available for gas strategy

  constructor(chainAdapters: Map<string, EVMAdapter>, antiSybilEngine: any) {
    this.chainAdapters = chainAdapters;
    this.antiSybilEngine = antiSybilEngine; // Inject AntiSybilEngine
  }

  async executeInteraction(
    chain: string, // Added chain parameter to select adapter
    type: string,
    contractAddress: string,
    parameters: any,
    privateKey: string, // Wallet's private key for signing
    gasStrategy: 'random' | 'fast' | 'average'
  ): Promise<InteractionResult> {
    console.log(`Executing ${type} interaction on ${chain} for contract ${contractAddress} with params:`, parameters);

    const adapter = this.chainAdapters.get(chain);
    if (!adapter) {
      return { success: false, error: `No EVMAdapter found for chain: ${chain}` };
    }

    try {
      const wallet = new ethers.Wallet(privateKey, adapter['provider']); // Use the adapter's provider

      // Fetch current gas data
      const gasData = await adapter.fetchGasData();
      let gasPrice = ethers.parseUnits('20', 'gwei'); // Default to 20 Gwei

      if (gasStrategy === 'random') {
        gasPrice = ethers.parseUnits(this.antiSybilEngine.getRandomGasPrice(), 'wei'); // Use AntiSybilEngine for random gas
      } else if (gasStrategy === 'fast' && gasData.maxFeePerGas) {
        gasPrice = ethers.parseUnits(gasData.maxFeePerGas, 'wei'); // Use fast gas if available
      } else if (gasStrategy === 'average' && gasData.gasPrice) {
        gasPrice = ethers.parseUnits(gasData.gasPrice, 'wei'); // Use average gas if available
      }

      // Construct a basic transaction payload. This will need to be more sophisticated
      // based on the actual interaction type and contract ABI.
      // For now, we'll assume a simple value transfer or a generic contract call.
      const tx: ethers.TransactionRequest = {
        to: contractAddress,
        value: parameters.value ? ethers.parseEther(parameters.value.toString()) : 0, // Example: if parameters include a 'value'
        data: parameters.data || '0x', // Example: if parameters include 'data' for a contract call
        gasLimit: parameters.gasLimit || 210000, // Default gas limit, can be estimated
        gasPrice: gasPrice,
        nonce: await wallet.getNonce(),
      };

      // Simulate transaction (preflight check)
      const preflightResult = await adapter.simulateTransaction(tx);
      if (!preflightResult.success) {
        throw new Error('Preflight simulation failed: ' + preflightResult.error);
      }
      console.log('Preflight simulation successful. Estimated gas:', preflightResult.gasUsed);

      // Sign and send the transaction
      const signedTx = await wallet.signTransaction(tx);
      const sendResult = await adapter.sendTransaction(signedTx);

      if (sendResult.success) {
        console.log(`Interaction ${type} successful. TxHash: ${sendResult.hash}`);
        return {
          success: true,
          txHash: sendResult.hash,
          gasUsed: preflightResult.gasUsed, // Use estimated gas from preflight
          output: { status: 'completed' }
        };
      } else {
        throw new Error(sendResult.error || 'Transaction broadcast failed.');
      }
    } catch (error: any) {
      console.error(`Interaction ${type} failed:`, error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}