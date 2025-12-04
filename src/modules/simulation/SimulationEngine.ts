// SimulationEngine.ts
import { EVMAdapter } from '../adapters/EVMAdapter';
import config from 'config';
import { ethers } from 'ethers'; // Import ethers for TransactionRequest type

export class SimulationEngine {
  private maxConcurrentSimulations: number;
  private activeSimulations: number;
  private evmAdapter: EVMAdapter;
  private simulationTimeout: number;

  constructor(maxConcurrentSimulations?: number) {
    const simulationConfig = config.get('simulation') as any;
    const securityConfig = config.get('security') as any;

    this.maxConcurrentSimulations = maxConcurrentSimulations || simulationConfig.maxConcurrent || 5;
    this.simulationTimeout = simulationConfig.timeout || 3000;
    this.activeSimulations = 0;

    // Initialize EVMAdapter for the local fork
    this.evmAdapter = new EVMAdapter(
      simulationConfig.localForkRpcUrl,
      simulationConfig.localForkChainId,
      securityConfig.etherscanApiKey // Pass Etherscan API key
    );
  }

  async simulate(transaction: ethers.TransactionRequest): Promise<any> {
    console.log('Simulating transaction with EVMAdapter:', transaction);
    
    try {
      const simulationPromise = this.evmAdapter.simulateTransaction(transaction);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Simulation timed out')), this.simulationTimeout)
      );

      const result = await Promise.race([simulationPromise, timeoutPromise]);

      if (result.success) {
        // Mock estimated reward and confidence based on successful simulation
        const estimatedReward = Math.random() * 1000; // Example: 0 to 1000 units
        const confidence = Math.random() * 0.2 + 0.8; // Example: 80-100% confidence for success

        return {
          success: true,
          gasUsed: result.gasUsed,
          estimatedReward: estimatedReward,
          confidence: confidence,
          message: result.message
        };
      } else {
        return {
          success: false,
          gasUsed: result.gasUsed,
          estimatedReward: 0,
          confidence: Math.random() * 0.3, // Lower confidence for failure
          error: result.error
        };
      }
    } catch (error: any) {
      console.error('Error during simulation:', error.message);
      return {
        success: false,
        gasUsed: "0",
        estimatedReward: 0,
        confidence: 0.1, // Very low confidence on error
        error: error.message
      };
    }
  }

  async simulateBatch(transactions: ethers.TransactionRequest[]): Promise<any[]> {
    const results = [];
    const promises = [];

    for (const tx of transactions) {
      if (this.activeSimulations >= this.maxConcurrentSimulations) {
        // Wait for a simulation to complete if max concurrent limit is reached
        await Promise.race(promises);
      }
      
      this.activeSimulations++;
      const simulationPromise = this.simulate(tx).finally(() => {
        this.activeSimulations--;
      });
      promises.push(simulationPromise);
      results.push({
        transaction: tx,
        result: simulationPromise // Store the promise, will resolve later
      });
    }
    
    // Wait for all simulations in the batch to complete
    await Promise.all(promises);

    // Resolve the results
    return results.map(item => ({
      transaction: item.transaction,
      result: item.result // This will now be the resolved value
    }));
  }
}