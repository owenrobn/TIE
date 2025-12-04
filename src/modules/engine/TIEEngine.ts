// TIEEngine.ts
import { Detector } from '../detectors/Detector';
import { NewChainDetector } from '../detectors/NewChainDetector';
import { NewContractDeploymentDetector } from '../detectors/NewContractDeploymentDetector';
import { StakingRewardSpikeDetector } from '../detectors/StakingRewardSpikeDetector';
import { BridgeEventDetector } from '../detectors/BridgeEventDetector';
import { GovernanceActivityDetector } from '../detectors/GovernanceActivityDetector';
import { LiquidityBootstrappingDetector } from '../detectors/LiquidityBootstrappingDetector';
import { PriceMismatchDetector } from '../detectors/PriceMismatchDetector';
import { OracleLagDetector } from '../detectors/OracleLagDetector';
import { LiquidityImbalanceDetector } from '../detectors/LiquidityImbalanceDetector';
import { IncentiveMisalignmentDetector } from '../detectors/IncentiveMisalignmentDetector';
import { LiquidationOpportunityDetector } from '../detectors/LiquidationOpportunityDetector';
import { SimulationEngine } from '../simulation/SimulationEngine';
import { ScoringEngine } from '../scoring/ScoringEngine';
import { SignalDispatcher } from '../signals/SignalDispatcher';
import { ContractFingerprinter } from '../fingerprinting/ContractFingerprinter';
import { EVMAdapter } from '../adapters/EVMAdapter';
import { DatabaseService } from '../storage/DatabaseService'; // Import DatabaseService
import config from 'config'; // Import config for webhook secret

export class TIEEngine {
  private detectors: Detector[];
  private simulationEngine: SimulationEngine;
  private scoringEngine: ScoringEngine;
  private signalDispatcher: SignalDispatcher;
  private contractFingerprinter: ContractFingerprinter;
  private chainAdapters: Map<string, EVMAdapter>;
  private running: boolean;
  private databaseService: DatabaseService; // Add DatabaseService

  constructor(databaseService: DatabaseService) {
    this.databaseService = databaseService;
    this.detectors = []; // Initialize empty, will load from DB
    
    this.simulationEngine = new SimulationEngine();
    this.scoringEngine = new ScoringEngine();
    
    const securityConfig = config.get('security') as any;
    this.signalDispatcher = new SignalDispatcher(
      securityConfig.webhookUrl || 'https://webhook.example.com/receive', // Use config for webhook URL
      securityConfig.webhookSecret || 'your-webhook-secret'
    );
    this.contractFingerprinter = new ContractFingerprinter();
    this.chainAdapters = new Map();
    this.running = false;

    this.initializeChainAdapters();
  }

  private initializeChainAdapters(): void {
    const chainsConfig = config.get('chains') as any;

    if (chainsConfig.ethereum) {
      this.chainAdapters.set('ethereum-sepolia', new EVMAdapter(
        chainsConfig.ethereum.rpc,
        chainsConfig.ethereum.chainId
      ));
    }
    if (chainsConfig.arbitrum) {
      this.chainAdapters.set('arbitrum-sepolia', new EVMAdapter(
        chainsConfig.arbitrum.rpc,
        chainsConfig.arbitrum.chainId
      ));
    }
    if (chainsConfig.optimism) {
      this.chainAdapters.set('optimism-sepolia', new EVMAdapter(
        chainsConfig.optimism.rpc,
        chainsConfig.optimism.chainId
      ));
    }
    if (chainsConfig.base) {
      this.chainAdapters.set('base-sepolia', new EVMAdapter(
        chainsConfig.base.rpc,
        chainsConfig.base.chainId
      ));
    }
  }

  private async loadDetectors(): Promise<void> {
    const storedDetectors = await this.databaseService.getDetectors();
    const availableDetectors = [
      NewChainDetector,
      NewContractDeploymentDetector,
      StakingRewardSpikeDetector,
      BridgeEventDetector,
      GovernanceActivityDetector,
      LiquidityBootstrappingDetector,
      PriceMismatchDetector,
      OracleLagDetector,
      LiquidityImbalanceDetector,
      IncentiveMisalignmentDetector,
      LiquidationOpportunityDetector
    ];

    for (const DetectorClass of availableDetectors) {
      const instance = new DetectorClass();
      const stored = storedDetectors.find(d => d.name === instance.name);

      if (stored) {
        instance.id = stored.id;
        instance.enabled = stored.enabled;
        instance.lastRun = stored.last_run ? new Date(stored.last_run) : null;
        // Status is managed by the engine, not directly by the detector instance
      } else {
        // If not in DB, save it with default values
        const newRecord = await this.databaseService.saveDetector({
          name: instance.name,
          enabled: instance.enabled,
          last_run: instance.lastRun,
          status: instance.enabled ? 'active' : 'inactive'
        });
        instance.id = newRecord.id;
      }
      this.detectors.push(instance);
    }
    console.log(`Loaded ${this.detectors.length} detectors from database.`);
  }

  async start(): Promise<void> {
    if (this.running) {
      console.log('TIE Engine is already running');
      return;
    }

    this.running = true;
    console.log('Starting TIE Engine...');

    await this.databaseService.connect(); // Connect to DB
    await this.loadDetectors(); // Load detectors from DB

    // Start all detectors
    for (const detector of this.detectors) {
      this.runDetector(detector);
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    console.log('Stopping TIE Engine...');
    await this.databaseService.disconnect(); // Disconnect from DB
  }

  private async runDetector(detector: Detector): Promise<void> {
    const detectorConfig = (config.get('detectors') as any)[detector.name.replace('Detector', '')];
    const interval = detectorConfig?.interval || 5000; // Default to 5 seconds if not configured

    while (this.running) {
      try {
        if (detector.enabled) {
          const results = await detector.run();
          await this.databaseService.updateDetectorByName(detector.name, {
            last_run: detector.lastRun,
            status: 'active'
          });
          
          for (const result of results) {
            await this.processDetection(result, detector.name);
          }
        } else {
          await this.databaseService.updateDetectorByName(detector.name, {
            status: 'inactive'
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error(`Error running detector ${detector.name}:`, error);
        await this.databaseService.updateDetectorByName(detector.name, {
          status: 'error'
        });
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait longer on error
      }
    }
  }

  private async processDetection(detection: any, detectorName: string): Promise<void> {
    console.log(`Processing detection from ${detectorName}:`, detection);

    let fingerprint = null;
    if (detection.address || detection.contract) {
      const address = detection.address || detection.contract;
      fingerprint = await this.contractFingerprinter.fingerprintContract(
        address,
        '', 
        {}  
      );
    }

    let simulation = null;
    if (detection.transaction) {
      simulation = await this.simulationEngine.simulate(detection.transaction);
    }

    const signalData = {
      chain: detection.chain,
      type: detection.type,
      context: {
        type: detection.type,
        description: detection.description,
        contract_address: detection.address || detection.contract,
        parameters: detection // Store full detection as parameters
      },
      simulation: simulation,
      score: 0, // Will be updated after scoring
      status: 'New',
      detector: detectorName,
      timestamp: new Date().toISOString()
    };

    const calculatedScore = this.scoringEngine.calculateScore({
      reward_depth: detection.confidence || 0.5,
      urgency: this.scoringEngine.calculateUrgency(signalData),
      confidence: detection.confidence || 0.5,
      sybil_risk: this.scoringEngine.calculateSybilRisk(signalData),
      capital_requirement: 0.2 
    });

    signalData.score = calculatedScore;

    // Save signal to database
    const savedSignal = await this.databaseService.saveSignal(signalData);
    console.log(`Signal ${savedSignal.id} saved to database with score ${calculatedScore}`);

    if (calculatedScore > 50) { // Dispatch threshold
      try {
        await this.signalDispatcher.dispatch({ ...signalData, id: savedSignal.id });
        console.log(`Signal ${savedSignal.id} dispatched with score ${calculatedScore}`);
      } catch (error) {
        console.error('Failed to dispatch signal:', error);
      }
    } else {
      console.log(`Signal score ${calculatedScore} below threshold, not dispatching`);
    }
  }

  getDetectorStatus(): any[] {
    return this.detectors.map(detector => ({
      id: detector.id,
      name: detector.name,
      enabled: detector.enabled,
      lastRun: detector.lastRun ? detector.lastRun.toISOString() : null,
      status: detector.enabled ? 'active' : 'inactive' // This status will be updated by runDetector
    }));
  }

  async toggleDetector(name: string): Promise<void> {
    const detector = this.detectors.find(d => d.name === name);
    if (detector) {
      detector.toggle();
      await this.databaseService.updateDetectorByName(detector.name, {
        enabled: detector.enabled,
        status: detector.enabled ? 'active' : 'inactive'
      });
      console.log(`Detector ${name} toggled to ${detector.enabled}`);
    }
  }

  async getSignals(): Promise<any[]> {
    return this.databaseService.getSignals();
  }
}