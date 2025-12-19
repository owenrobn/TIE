// src/modules/signals/SignalAssembler.ts
import { v4 as uuidv4 } from 'uuid';

// --- Input Interfaces ---

// Expected output from TestnetDetector
interface TestnetDetectorOutput {
  id: string;
  chainId: string;
  chainName: string;
  rpcUrl: string;
  discoveredAt: number;
  metrics: {
    txPerDay: number;
    activeWallets: number;
    newContractsPerDay: number;
    avgGasUsed: number;
    blockStability: number;
    verifiedContracts: number;
    hasBridge: boolean;
    hasGovernance: boolean;
    hasStaking: boolean;
    bytecodeComplexity: number;
    abiRichness: number;
    faucetDrainRate: number;
    walletOverlapRatio: number;
    txPatternSimilarity: number;
    timeClustering: number;
    noiseScore: number;
  };
}

// Expected output from TestnetRarityScorer.calculateRarityScore
interface RarityScorerOutput {
  rarityScore: number;
  breakdown: {
    activityHealth: number;
    contractDepth: number;
    saturation: number;
    noise: number;
  };
  classification: "dead" | "early" | "prime" | "rare" | "overexposed";
}

// --- Final Signal Schema (DO NOT MODIFY) ---
interface TestnetSignal {
  signalId: string;
  type: "testnet_intelligence";
  severity: "low" | "medium" | "high" | "critical";

  timestamp: number;

  testnet: {
    chainId: string; // Changed from number to string to match TestnetDetectorOutput
    chainName: string;
    rpcUrl: string;
    explorerUrl?: string;
    discoveredAt: number;
  };

  scores: {
    rarityScore: number;
    activityHealth: number;
    contractDepth: number;
    saturation: number;
    noise: number;
  };

  classification: "dead" | "early" | "prime" | "rare" | "overexposed";

  confidence: number; // 0-1
  riskLevel: "low" | "medium" | "high";

  reasoning: string[];

  recommendedActions: {
    action: string;
    priority: number;
    reason: string;
  }[];

  metadata: {
    source: "TIE";
    engineVersion: string;
    detectionLatencyMs?: number;
  };
}

export class SignalAssembler {
  private readonly engineVersion: string;

  constructor(engineVersion: string = "1.0.0") { // Default version for metadata
    this.engineVersion = engineVersion;
  }

  /**
   * Assembles a complete Testnet Intelligence signal from various inputs.
   *
   * @param detectorOutput The raw metrics and metadata from the TestnetDetector.
   * @param rarityScorerOutput The calculated rarity scores and classification from the TestnetRarityScorer.
   * @param confidence A confidence score (0-1) for the overall signal, typically from a ScoringEngine.
   * @param sybilRisk A sybil risk score (0-1), typically from a ScoringEngine.
   * @returns A fully populated TestnetSignal object.
   */
  assembleSignal(
    detectorOutput: TestnetDetectorOutput,
    rarityScorerOutput: RarityScorerOutput,
    confidence: number, // Expected 0-1
    sybilRisk: number   // Expected 0-1
  ): TestnetSignal {
    const timestamp = Date.now();
    const signalId = uuidv4();

    // Clamp confidence and sybilRisk to 0-1 range to ensure valid input
    const clampedConfidence = Math.max(0, Math.min(1, confidence));
    const clampedSybilRisk = Math.max(0, Math.min(1, sybilRisk));

    // Determine riskLevel based on sybilRisk
    let riskLevel: TestnetSignal['riskLevel'];
    if (clampedSybilRisk > 0.7) { // High sybil risk
      riskLevel = "high";
    } else if (clampedSybilRisk > 0.3) { // Medium sybil risk
      riskLevel = "medium";
    } else { // Low sybil risk
      riskLevel = "low";
    }

    // Determine severity based on rarityScore and confidence
    // Higher rarity and higher confidence lead to higher severity
    let severity: TestnetSignal['severity'];
    if (rarityScorerOutput.rarityScore >= 70 && clampedConfidence >= 0.8) {
      severity = "critical"; // Rare testnet with high confidence
    } else if (rarityScorerOutput.rarityScore >= 50 && clampedConfidence >= 0.6) {
      severity = "high"; // Prime testnet with good confidence
    } else if (rarityScorerOutput.rarityScore >= 30 && clampedConfidence >= 0.4) {
      severity = "medium"; // Early testnet with moderate confidence
    } else {
      severity = "low"; // Dead or overexposed testnet, or low confidence
    }

    // Generate reasoning strings from the score breakdown
    const reasoning: string[] = [];
    reasoning.push(`Overall Rarity Score: ${rarityScorerOutput.rarityScore.toFixed(2)} (${rarityScorerOutput.classification})`);
    reasoning.push(`Activity Health: ${rarityScorerOutput.breakdown.activityHealth.toFixed(2)}`);
    reasoning.push(`Contract Depth: ${rarityScorerOutput.breakdown.contractDepth.toFixed(2)}`);
    reasoning.push(`Saturation: ${rarityScorerOutput.breakdown.saturation.toFixed(2)}`);
    reasoning.push(`Noise: ${rarityScorerOutput.breakdown.noise.toFixed(2)}`);
    reasoning.push(`Signal Confidence: ${(clampedConfidence * 100).toFixed(0)}%`);
    reasoning.push(`Estimated Sybil Risk: ${(clampedSybilRisk * 100).toFixed(0)}% (${riskLevel})`);

    // Generate recommended actions based on the testnet's classification
    const recommendedActions: TestnetSignal['recommendedActions'] = [];
    switch (rarityScorerOutput.classification) {
      case "dead":
        recommendedActions.push({ action: "Ignore Testnet", priority: 10, reason: "Very low potential, likely inactive or overfarmed." });
        recommendedActions.push({ action: "Decommission Detectors", priority: 20, reason: "Reduce resource usage on this testnet." });
        break;
      case "early":
        recommendedActions.push({ action: "Monitor Closely", priority: 30, reason: "Emerging potential, observe for growth and new opportunities." });
        recommendedActions.push({ action: "Deploy Simple Contracts", priority: 40, reason: "Establish presence and test basic interactions." });
        break;
      case "prime":
        recommendedActions.push({ action: "Actively Engage", priority: 50, reason: "Good balance of activity and depth, high opportunity." });
        recommendedActions.push({ action: "Deploy Complex Contracts", priority: 60, reason: "Test advanced strategies and smart contract interactions." });
        recommendedActions.push({ action: "Participate in Governance", priority: 70, reason: "Influence protocol direction and earn potential rewards." });
        break;
      case "rare":
        recommendedActions.push({ action: "Prioritize Engagement", priority: 80, reason: "Exceptional potential, focus automation efforts here." });
        recommendedActions.push({ action: "High-Value Automation", priority: 90, reason: "Execute advanced, high-return strategies." });
        recommendedActions.push({ action: "Deep Dive Analysis", priority: 100, reason: "Manual review for unique, undiscovered opportunities." });
        break;
      case "overexposed":
        recommendedActions.push({ action: "Review Strategy", priority: 25, reason: "High risk of saturation, re-evaluate approach." });
        recommendedActions.push({ action: "Reduce Exposure", priority: 35, reason: "Minimize resource allocation to avoid detection." });
        break;
    }

    // Construct the final signal object
    const finalSignal: TestnetSignal = {
      signalId: signalId,
      type: "testnet_intelligence",
      severity: severity,
      timestamp: timestamp,
      testnet: {
        chainId: detectorOutput.chainId,
        chainName: detectorOutput.chainName,
        rpcUrl: detectorOutput.rpcUrl,
        // explorerUrl: detectorOutput.explorerUrl, // Assuming explorerUrl might be added to detectorOutput later
        discoveredAt: detectorOutput.discoveredAt,
      },
      scores: {
        rarityScore: rarityScorerOutput.rarityScore,
        activityHealth: rarityScorerOutput.breakdown.activityHealth,
        contractDepth: rarityScorerOutput.breakdown.contractDepth,
        saturation: rarityScorerOutput.breakdown.saturation,
        noise: rarityScorerOutput.breakdown.noise,
      },
      classification: rarityScorerOutput.classification,
      confidence: clampedConfidence,
      riskLevel: riskLevel,
      reasoning: reasoning,
      recommendedActions: recommendedActions,
      metadata: {
        source: "TIE",
        engineVersion: this.engineVersion,
        // detectionLatencyMs: undefined, // This would be calculated upstream if needed
      },
    };

    return finalSignal;
  }
}