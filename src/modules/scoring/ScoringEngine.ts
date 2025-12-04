// ScoringEngine.ts
export class ScoringEngine {
  calculateScore(signal: any): number {
    // Implementation of the scoring formula:
    // final_score = 0.35*reward_depth + 0.25*urgency + 0.20*confidence - 0.10*sybil_risk - 0.10*capital_requirement
    
    const reward_depth = this.calculateRewardDepth(signal);
    const urgency = this.calculateUrgency(signal);
    const confidence = signal.confidence || 0.5; // Use provided confidence or default
    const sybil_risk = this.calculateSybilRisk(signal);
    const capital_requirement = this.calculateCapitalRequirement(signal);
    
    const score = (
      0.35 * reward_depth +
      0.25 * urgency +
      0.20 * confidence -
      0.10 * sybil_risk -
      0.10 * capital_requirement
    ) * 100; // Scale to 0-100
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  calculateRewardDepth(signal: any): number {
    // Reward depth calculation based on signal type and simulation results
    let depth = 0.1; // Base depth

    if (signal.simulation?.success && signal.simulation.estimatedReward > 0) {
      depth += Math.min(0.5, signal.simulation.estimatedReward / 10000); // Scale reward to 0-0.5
    }

    if (signal.context?.fingerprint?.hasRewards) {
      depth += 0.2;
    }
    if (signal.type === 'Staking Reward Spike') {
      depth += 0.3;
    } else if (signal.type === 'Liquidity Bootstrapping') {
      depth += 0.2;
    }

    return Math.min(1.0, depth); // Ensure depth is between 0 and 1
  }

  calculateUrgency(signal: any): number {
    // Calculate urgency based on signal timestamp
    const now = new Date();
    const signalTime = new Date(signal.timestamp);
    const timeDiffMinutes = (now.getTime() - signalTime.getTime()) / (1000 * 60);
    
    // More urgent if very recent
    if (timeDiffMinutes < 5) return 1.0; // Very high urgency for signals within 5 minutes
    if (timeDiffMinutes < 30) return 0.8; // High urgency for signals within 30 minutes
    if (timeDiffMinutes < 120) return 0.6; // Medium urgency for signals within 2 hours
    if (timeDiffMinutes < 720) return 0.4; // Low urgency for signals within 12 hours
    if (timeDiffMinutes < 1440) return 0.2; // Very low urgency for signals within 24 hours
    return 0.1; // Minimal urgency for older signals
  }

  calculateConfidence(signal: any): number {
    // Confidence could come from the detector itself, or from simulation results.
    // For now, we'll use a value from detection or a default.
    return signal.confidence || 0.5; // Example: 0.0 to 1.0
  }

  calculateSybilRisk(signal: any): number {
    // Sybil risk calculation based on mock wallet age and random factors
    let risk = 0.1; // Base risk

    const walletAgeDays = signal.walletAgeDays || Math.floor(Math.random() * 30);
    if (walletAgeDays < 7) { // Newer wallets might have higher sybil risk
      risk += 0.3;
    } else if (walletAgeDays < 30) {
      risk += 0.1;
    }

    if (signal.context?.fingerprint?.riskScore) {
      risk += signal.context.fingerprint.riskScore * 0.2; // Factor in contract risk
    }

    if (Math.random() > 0.8) { // 20% chance of higher random risk
      risk += 0.2;
    }
    return Math.min(1.0, risk); // Ensure risk is between 0 and 1
  }

  calculateCapitalRequirement(signal: any): number {
    // Capital requirement calculation based on signal type and potential interaction
    let requirement = 0.1; // Base requirement

    if (signal.type === 'Liquidation Opportunity') {
      requirement += 0.5; // Liquidations often require significant capital
    } else if (signal.type === 'Liquidity Bootstrapping') {
      requirement += 0.3; // Providing liquidity also requires capital
    } else if (signal.type === 'Price Mismatch' || signal.type === 'Oracle Lag') {
      requirement += 0.2; // Arbitrage can require capital
    }

    // If simulation provides a required capital, use that
    if (signal.simulation?.requiredCapital) {
      requirement = Math.min(1.0, requirement + signal.simulation.requiredCapital / 10000); // Scale example
    }

    return Math.min(1.0, requirement); // Ensure requirement is between 0 and 1
  }
}