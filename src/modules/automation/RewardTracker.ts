// RewardTracker.ts
interface ExecutionRecord {
  signalId: string;
  walletAddress: string;
  timestamp: string;
  result: any; // Result from InteractionEngine
}

interface RewardRecord {
  walletAddress: string;
  token: string;
  amount: string;
  timestamp: string;
  source: string; // e.g., 'execution', 'external_detection'
}

export class RewardTracker {
  private executions: ExecutionRecord[];
  private rewards: RewardRecord[];
  private lastExecutionTimestamp: string | null;

  constructor() {
    this.executions = [];
    this.rewards = [];
    this.lastExecutionTimestamp = null;
  }

  recordExecution(signalId: string, walletAddress: string, result: any): void {
    const record: ExecutionRecord = {
      signalId,
      walletAddress,
      timestamp: new Date().toISOString(),
      result,
    };
    this.executions.push(record);
    this.lastExecutionTimestamp = record.timestamp;
    console.log(`Recorded execution for signal ${signalId}`);

    // Simulate reward detection from execution result
    if (result.success && result.output?.rewardAmount) {
      this.recordReward(walletAddress, 'MockToken', result.output.rewardAmount, 'execution');
    }
  }

  recordReward(walletAddress: string, token: string, amount: string, source: string): void {
    const record: RewardRecord = {
      walletAddress,
      token,
      amount,
      timestamp: new Date().toISOString(),
      source,
    };
    this.rewards.push(record);
    console.log(`Recorded reward: ${amount} ${token} for ${walletAddress}`);
  }

  getExecutions(walletAddress?: string): ExecutionRecord[] {
    if (walletAddress) {
      return this.executions.filter(exec => exec.walletAddress === walletAddress);
    }
    return this.executions;
  }

  getRewards(walletAddress?: string): RewardRecord[] {
    if (walletAddress) {
      return this.rewards.filter(reward => reward.walletAddress === walletAddress);
    }
    return this.rewards;
  }

  getLastExecutionTimestamp(): string | null {
    return this.lastExecutionTimestamp;
  }
}