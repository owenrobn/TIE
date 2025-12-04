// ScoringEngine.ts
export class ScoringEngine {
  calculateScore(signal: any): number {
    // Implementation of the scoring formula:
    // final_score = 0.35*reward + 0.25*urgency + 0.20*confidence - 0.10*sybil_risk - 0.10*capital_requirement
    
    const {
      reward_depth = 0,
      urgency = 0,
      confidence = 0,
      sybil_risk = 0,
      capital_requirement = 0
    } = signal;
    
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

  calculateUrgency(signal: any): number {
    // Calculate urgency based on various factors
    const now = new Date();
    const signalTime = new Date(signal.timestamp);
    const timeDiffHours = (now.getTime() - signalTime.getTime()) / (1000 * 60 * 60);
    
    // More urgent if recent (within 1 hour)
    if (timeDiffHours < 1) return 1.0;
    if (timeDiffHours < 3) return 0.8;
    if (timeDiffHours < 6) return 0.6;
    if (timeDiffHours < 12) return 0.4;
    if (timeDiffHours < 24) return 0.2;
    return 0.1;
  }

  calculateSybilRisk(signal: any): number {
    // Calculate sybil risk based on various factors
    // In a real implementation, this would analyze behavioral patterns
    return Math.random() * 0.3; // Random for demo purposes
  }
}