// DecisionEngine.ts
export class DecisionEngine {
  decide(signal: any): { action: 'execute_immediately' | 'queue_for_execution' | 'ignore'; priority?: number; reason?: string } {
    const score = signal.score?.final || 0;
    const type = signal.context?.type;

    // Define safe action types (for demo, these are just examples)
    const safeActionTypes = [
      'Staking Reward Spike',
      'Governance Activity',
      'Liquidity Event',
      'New Contract Deployment' // Assuming deployment itself is safe, not interaction
    ];

    if (!safeActionTypes.includes(type)) {
      return { action: 'ignore', reason: `Unsafe action type: ${type}` };
    }

    if (score < 60) {
      return { action: 'ignore', reason: 'Score below threshold (60)' };
    } else if (score >= 60 && score <= 75) {
      // Queue with priority based on score (higher score = higher priority)
      return { action: 'queue_for_execution', priority: score };
    } else { // score > 75
      return { action: 'execute_immediately' };
    }
  }
}