// TIEEngine.ts
import { Detector } from '../detectors/Detector';
import { NewChainDetector } from '../detectors/NewChainDetector';
import { NewContractDeploymentDetector } from '../detectors/NewContractDeploymentDetector';
import { StakingRewardSpikeDetector } from '../detectors/StakingRewardSpikeDetector';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { ScoringEngine } from '../scoring/ScoringEngine';
import { SignalDispatcher } from '../signals/SignalDispatcher';
import { ContractFingerprinter } from '../fingerprinting/ContractFingerprinter';
import { EVMAdapter } from '../adapters/EVMAdapter';

export class TIEEngine {
  private detectors: Detector[];
  private simulationEngine: SimulationEngine;
  private scoringEngine: ScoringEngine;
  private signalDispatcher: SignalDispatcher;
  private contractFingerprinter: ContractFingerprinter;
  private chainAdapters: Map<string, EVMAdapter>;
  private running: boolean;

  constructor() {
    this.detectors = [
      new NewChainDetector(),
      new NewContractDeploymentDetector(),
      new StakingRewardSpikeDetector()
    ];
    
    this.simulationEngine = new SimulationEngine();
    this.scoringEngine = new ScoringEngine();
    this.signalDispatcher = new SignalDispatcher(
      'https://webhook.example.com/receive',
      'your-webhook-secret'
    );
    this.contractFingerprinter = new ContractFingerprinter();
    this.chainAdapters = new Map();
    this.running = false;
    
    // Initialize chain adapters
    this.initializeChainAdapters();
  }

  private initializeChainAdapters(): void {
    // Initialize adapters for different chains
    this.chainAdapters.set('ethereum-sepolia', 
      new EVMAdapter('https://eth-sepolia.g.alchemy.com/v2/your-api-key', 'ethereum-sepolia'));
    this.chainAdapters.set('arbitrum-sepolia', 
      new EVMAdapter('https://arb-sepolia.g.alchemy.com/v2/your-api-key', 'arbitrum-sepolia'));
    this.chainAdapters.set('optimism-sepolia', 
      new EVMAdapter('https://opt-sepolia.g.alchemy.com/v2/your-api-key', 'optimism-sepolia'));
    this.chainAdapters.set('base-sepolia', 
      new EVMAdapter('https://base-sepolia.g.alchemy.com/v2/your-api-key', 'base-sepolia'));
  }

  async start(): Promise<void> {
    if (this.running) {
      console.log('TIE Engine is already running');
      return;
    }
    
    this.running = true;
    console.log('Starting TIE Engine...');
    
    // Start all detectors
    for (const detector of this.detectors) {
      this.runDetector(detector);
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    console.log('Stopping TIE Engine...');
  }

  private async runDetector(detector: Detector): Promise<void> {
    while (this.running) {
      try {
        // Run the detector
        const results = await detector.run();
        
        // Process each detection result
        for (const result of results) {
          await this.processDetection(result, detector.name);
        }
        
        // Wait before next run (configurable)
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (error) {
        console.error(`Error running detector ${detector.name}:`, error);
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  }

  private async processDetection(detection: any, detectorName: string): Promise<void> {
    console.log(`Processing detection from ${detectorName}:`, detection);
    
    // Step 1: Fingerprint the contract (if applicable)
    let fingerprint = null;
    if (detection.address || detection.contract) {
      const address = detection.address || detection.contract;
      // In a real implementation, we would fetch bytecode and ABI
      fingerprint = await this.contractFingerprinter.fingerprintContract(
        address, 
        '', // bytecode
        {}  // abi
      );
    }
    
    // Step 2: Simulate interaction (if applicable)
    let simulation = null;
    if (detection.transaction) {
      simulation = await this.simulationEngine.simulate(detection.transaction);
    }
    
    // Step 3: Calculate score
    const signal = {
      ...detection,
      detector: detectorName,
      fingerprint,
      simulation,
      timestamp: new Date().toISOString()
    };
    
    const score = this.scoringEngine.calculateScore({
      reward_depth: detection.confidence || 0.5,
      urgency: this.scoringEngine.calculateUrgency(signal),
      confidence: detection.confidence || 0.5,
      sybil_risk: this.scoringEngine.calculateSybilRisk(signal),
      capital_requirement: 0.2 // Default value
    });
    
    // Add score to signal
    signal.score = score;
    
    // Step 4: Dispatch signal if score is above threshold
    if (score > 50) {
      try {
        await this.signalDispatcher.dispatch(signal);
        console.log(`Signal dispatched with score ${score}`);
      } catch (error) {
        console.error('Failed to dispatch signal:', error);
      }
    } else {
      console.log(`Signal score ${score} below threshold, not dispatching`);
    }
  }

  getDetectorStatus(): any[] {
    return this.detectors.map(detector => ({
      name: detector.name,
      enabled: detector.enabled,
      lastRun: detector.lastRun,
      status: detector.enabled ? 'active' : 'inactive'
    }));
  }

  toggleDetector(name: string): void {
    const detector = this.detectors.find(d => d.name === name);
    if (detector) {
      detector.toggle();
    }
  }
}