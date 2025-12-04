// TAEEngine.ts
import { SignalReceiver } from './SignalReceiver';
import { DecisionEngine } from './DecisionEngine';
import { WalletManager } from './WalletManager';
import { AntiSybilEngine } from './AntiSybilEngine';
import { InteractionEngine } from './InteractionEngine';
import { RewardTracker } from './RewardTracker';
import { ExecutionQueue } from './ExecutionQueue';
import { ReportingEngine } from './ReportingEngine';

export class TAEEngine {
  private signalReceiver: SignalReceiver;
  private decisionEngine: DecisionEngine;
  private walletManager: WalletManager;
  private antiSybilEngine: AntiSybilEngine;
  private interactionEngine: InteractionEngine;
  private rewardTracker: RewardTracker;
  private executionQueue: ExecutionQueue;
  private reportingEngine: ReportingEngine;
  private running: boolean;

  constructor() {
    // Initialize components with mock data/configs for now
    this.signalReceiver = new SignalReceiver('your-tie-secret-key');
    this.decisionEngine = new DecisionEngine();
    this.walletManager = new WalletManager();
    this.antiSybilEngine = new AntiSybilEngine();
    this.interactionEngine = new InteractionEngine(); // Will need EVMAdapter later
    this.rewardTracker = new RewardTracker();
    this.executionQueue = new ExecutionQueue();
    this.reportingEngine = new ReportingEngine('https://n8n.example.com/webhook');
    this.running = false;
  }

  async start(): Promise<void> {
    if (this.running) {
      console.log('TAE Engine is already running');
      return;
    }

    this.running = true;
    console.log('Starting Testnet Automation Engine...');

    // Start processing signals from the queue
    this.processQueue();
  }

  async stop(): Promise<void> {
    this.running = false;
    console.log('Stopping Testnet Automation Engine...');
  }

  async receiveSignal(signalPayload: any, signature: string): Promise<boolean> {
    try {
      const isValid = this.signalReceiver.verifySignal(signalPayload, signature);
      if (!isValid) {
        console.warn('Received invalid signal signature.');
        return false;
      }

      console.log('Received valid signal:', signalPayload.signal_id);
      const decision = this.decisionEngine.decide(signalPayload);

      switch (decision.action) {
        case 'execute_immediately':
          console.log(`Executing signal ${signalPayload.signal_id} immediately.`);
          this.executeSignal(signalPayload);
          break;
        case 'queue_for_execution':
          console.log(`Queueing signal ${signalPayload.signal_id}. Priority: ${decision.priority}`);
          this.executionQueue.add(signalPayload, decision.priority);
          break;
        case 'ignore':
          console.log(`Ignoring signal ${signalPayload.signal_id}. Reason: ${decision.reason}`);
          break;
      }
      return true;
    } catch (error) {
      console.error('Error processing received signal:', error);
      return false;
    }
  }

  private async processQueue(): Promise<void> {
    while (this.running) {
      const signal = this.executionQueue.getNext();
      if (signal) {
        console.log(`Processing queued signal: ${signal.signal_id}`);
        await this.executeSignal(signal);
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // Check queue every second
    }
  }

  private async executeSignal(signal: any): Promise<void> {
    const wallet = this.walletManager.selectWallet(signal); // Select a wallet based on signal
    if (!wallet) {
      console.error(`No suitable wallet found for signal ${signal.signal_id}`);
      this.executionQueue.addFailed(signal, 'No suitable wallet');
      return;
    }

    try {
      const antiSybilConfig = this.antiSybilEngine.getAntiSybilConfig(wallet.persona);
      await new Promise(resolve => setTimeout(resolve, antiSybilConfig.delay)); // Apply delay

      console.log(`Executing action for signal ${signal.signal_id} with wallet ${wallet.address}`);
      const executionResult = await this.interactionEngine.executeInteraction(
        signal.context.type,
        signal.context.contract_address,
        signal.context.parameters,
        wallet.privateKey,
        antiSybilConfig.gasStrategy
      );

      this.rewardTracker.recordExecution(signal.signal_id, wallet.address, executionResult);
      this.reportingEngine.reportExecution(signal.signal_id, wallet.address, executionResult);

      console.log(`Signal ${signal.signal_id} executed successfully.`);
    } catch (error: any) {
      console.error(`Execution failed for signal ${signal.signal_id}:`, error);
      this.executionQueue.addFailed(signal, error.message);
      this.reportingEngine.reportExecution(signal.signal_id, wallet.address, { success: false, error: error.message });
    }
  }

  getEngineStatus(): any {
    return {
      running: this.running,
      queueSize: this.executionQueue.size(),
      walletsActive: this.walletManager.getWallets().length,
      lastSignalReceived: this.signalReceiver.getLastSignalTimestamp(),
      lastExecution: this.rewardTracker.getLastExecutionTimestamp(),
    };
  }

  manuallyExecuteSignal(signalId: string): boolean {
    const signal = this.executionQueue.getById(signalId);
    if (signal) {
      this.executeSignal(signal);
      this.executionQueue.remove(signalId); // Remove from queue after manual execution
      return true;
    }
    return false;
  }
}