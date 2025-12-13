/**
 * @interface TestnetMetrics
 * Defines the structure of input metrics for the Testnet Rarity Scorer.
 * These metrics are assumed to be normalized and provided by upstream detectors.
 */
interface TestnetMetrics {
  // Activity Health Metrics
  txPerDay: number;             // Number of transactions per day
  activeWallets: number;        // Number of unique active wallets per day
  newContractsPerDay: number;   // Number of new contracts deployed per day
  avgGasUsed: number;           // Average gas used per transaction
  blockStability: number;       // 0–1, e.g., 1 = perfect stability, 0 = constant reorgs

  // Contract Depth Metrics
  verifiedContracts: number;    // Number of verified contracts
  hasBridge: boolean;           // True if a recognized bridge exists
  hasGovernance: boolean;       // True if a recognized governance system exists
  hasStaking: boolean;          // True if a recognized staking mechanism exists
  bytecodeComplexity: number;   // 0–1, e.g., average complexity of deployed contract bytecodes
  abiRichness: number;          // 0–1, e.g., average number of functions/events in ABIs

  // Saturation Metrics (Anti-Sybil)
  faucetDrainRate: number;      // tx/min, rate at which faucet funds are claimed
  walletOverlapRatio: number;   // 0–1, e.g., ratio of wallets with similar activity patterns
  txPatternSimilarity: number;  // 0–1, e.g., average similarity of transaction patterns across wallets
  timeClustering: number;       // 0–1, e.g., degree to which transactions cluster at specific times

  // External Noise Metric
  noiseScore: number;           // 0–100, external signal indicating spam or irrelevant activity
}

/**
 * Clamps a value between a minimum and maximum.
 * @param value The value to clamp.
 * @param min The minimum allowed value.
 * @param max The maximum allowed value.
 * @returns The clamped value.
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(value, max));
};

/**
 * Scales a value from an input range to a target 0-100 range.
 * @param value The input value.
 * @param inputMin The minimum of the input range.
 * @param inputMax The maximum of the input range.
 * @param reverse If true, higher input values result in lower scaled values.
 * @returns The scaled value between 0 and 100.
 */
const scaleTo100 = (value: number, inputMin: number, inputMax: number, reverse: boolean = false): number => {
  if (inputMax === inputMin) return reverse ? 0 : 100; // Avoid division by zero
  const scaled = (value - inputMin) / (inputMax - inputMin) * 100;
  const clamped = clamp(scaled, 0, 100);
  return reverse ? 100 - clamped : clamped;
};

/**
 * Calculates the Activity Health score (0-100) for a testnet.
 * This score reflects the genuine and sustainable level of activity.
 * A healthy testnet has consistent transactions, active users, and new development.
 *
 * @param metrics The TestnetMetrics object.
 * @returns A number between 0 and 100 representing the activity health.
 */
const calculateActivityHealth = (metrics: TestnetMetrics): number => {
  // txPerDay: Higher is generally better, but extremely high might indicate spam.
  // We look for a sweet spot, penalizing both too low and excessively high.
  // Why it matters: Indicates organic usage and network vitality.
  const txPerDayScore = scaleTo100(metrics.txPerDay, 50, 5000); // Good range: 50-5000 tx/day
  const txPerDayPenalty = metrics.txPerDay > 10000 ? 20 : 0; // Penalize extreme spam
  let finalTxPerDayScore = clamp(txPerDayScore - txPerDayPenalty, 0, 100);

  // activeWallets: Directly correlates with adoption and community engagement.
  // Why it matters: Reflects the number of unique participants, a key indicator of health.
  const activeWalletsScore = scaleTo100(metrics.activeWallets, 10, 1000); // Good range: 10-1000 active wallets

  // newContractsPerDay: Indicates developer interest and ecosystem growth.
  // Why it matters: Shows innovation and potential for new opportunities.
  const newContractsPerDayScore = scaleTo100(metrics.newContractsPerDay, 1, 50); // Good range: 1-50 new contracts/day

  // avgGasUsed: Healthy gas usage suggests real transactions, not just zero-cost spam.
  // Too low (e.g., 0) is bad, too high might indicate congestion or expensive operations.
  // Why it matters: Differentiates meaningful transactions from simple, low-cost spam.
  const minAvgGas = 21000; // Minimum for a simple transfer
  const maxAvgGas = 100000; // Upper bound for healthy average
  const avgGasUsedScore = scaleTo100(metrics.avgGasUsed, minAvgGas, maxAvgGas);

  // blockStability: Crucial for a reliable and trustworthy testnet. Frequent reorgs are a red flag.
  // Why it matters: A stable chain is predictable and reliable for testing and automation.
  const blockStabilityScore = metrics.blockStability * 100; // 0-1 directly scales to 0-100

  // Combine scores with weights. Weights reflect relative importance.
  // Why these weights: Active wallets and transactions are fundamental. New contracts show growth.
  // Gas usage and stability ensure quality over quantity.
  const activityHealth = (
    0.30 * finalTxPerDayScore +
    0.30 * activeWalletsScore +
    0.20 * newContractsPerDayScore +
    0.10 * avgGasUsedScore +
    0.10 * blockStabilityScore
  );

  return clamp(activityHealth, 0, 100);
};

/**
 * Calculates the Contract Depth score (0-100) for a testnet.
 * This score reflects the maturity, complexity, and feature richness of the deployed contracts.
 * A deeper contract ecosystem offers more potential interaction points.
 *
 * @param metrics The TestnetMetrics object.
 * @returns A number between 0 and 100 representing the contract depth.
 */
const calculateContractDepth = (metrics: TestnetMetrics): number => {
  // verifiedContracts: Indicates transparency, trust, and auditability.
  // Why it matters: Verified contracts are safer and more likely to be legitimate.
  const verifiedContractsScore = scaleTo100(metrics.verifiedContracts, 0, 100); // Max 100 verified contracts for full score

  // hasBridge: Presence of a bridge indicates connectivity and multi-chain potential.
  // Why it matters: Enables cross-chain strategies and broader ecosystem integration.
  const hasBridgeScore = metrics.hasBridge ? 100 : 0; // Full score if bridge exists

  // hasGovernance: Indicates decentralization and community involvement.
  // Why it matters: Opportunities for participation in protocol evolution.
  const hasGovernanceScore = metrics.hasGovernance ? 100 : 0; // Full score if governance exists

  // hasStaking: Presence of staking mechanisms suggests DeFi opportunities.
  // Why it matters: Direct reward opportunities and protocol engagement.
  const hasStakingScore = metrics.hasStaking ? 100 : 0; // Full score if staking exists

  // bytecodeComplexity: Higher complexity suggests more sophisticated applications.
  // Why it matters: Complex contracts often imply more advanced features and potential exploits/opportunities.
  const bytecodeComplexityScore = metrics.bytecodeComplexity * 100; // 0-1 directly scales to 0-100

  // abiRichness: More functions and events imply more ways to interact with the contract.
  // Why it matters: Greater surface area for detection and automation.
  const abiRichnessScore = metrics.abiRichness * 100; // 0-1 directly scales to 0-100

  // Combine scores with weights. Weights reflect relative importance.
  // Why these weights: Verified contracts are foundational. Feature flags (bridge, governance, staking)
  // add specific types of opportunities. Complexity and richness indicate depth.
  const contractDepth = (
    0.25 * verifiedContractsScore +
    0.15 * hasBridgeScore +
    0.10 * hasGovernanceScore +
    0.10 * hasStakingScore +
    0.20 * bytecodeComplexityScore +
    0.20 * abiRichnessScore
  );

  return clamp(contractDepth, 0, 100);
};

/**
 * Calculates the Saturation score (0-100) for a testnet.
 * This score indicates how "farmed" or "sybil-attacked" the testnet is.
 * High saturation suggests diminishing returns and increased risk of detection.
 *
 * @param metrics The TestnetMetrics object.
 * @returns A number between 0 and 100 representing the saturation level.
 */
const calculateSaturation = (metrics: TestnetMetrics): number => {
  // faucetDrainRate: A high drain rate suggests bots or sybil attacks aggressively claiming funds.
  // Why it matters: Indicates automated farming, reducing opportunities for genuine users.
  const faucetDrainScore = scaleTo100(metrics.faucetDrainRate, 0, 50, false); // 0-50 tx/min, higher is worse

  // walletOverlapRatio: A high ratio means many wallets share similar characteristics or origins.
  // Why it matters: Strong indicator of sybil activity.
  const walletOverlapScore = metrics.walletOverlapRatio * 100; // 0-1 directly scales to 0-100

  // txPatternSimilarity: Similar transaction patterns across multiple wallets suggest bot activity.
  // Why it matters: Bots often execute identical or highly similar sequences of transactions.
  const txPatternSimilarityScore = metrics.txPatternSimilarity * 100; // 0-1 directly scales to 0-100

  // timeClustering: Transactions occurring at precise, regular intervals.
  // Why it matters: A hallmark of automated scripts rather than human interaction.
  const timeClusteringScore = metrics.timeClustering * 100; // 0-1 directly scales to 0-100

  // Combine scores with weights. Higher values mean higher saturation.
  // Why these weights: Faucet drain and wallet overlap are strong indicators of sybil.
  // Transaction pattern and time clustering reinforce bot activity.
  const saturation = (
    0.35 * faucetDrainScore +
    0.30 * walletOverlapScore +
    0.20 * txPatternSimilarityScore +
    0.15 * timeClusteringScore
  );

  return clamp(saturation, 0, 100);
};

/**
 * Calculates the Noise Penalty score (0-100).
 * This score directly uses an externally provided noise metric, reflecting
 * the presence of irrelevant or spammy activity that dilutes real opportunities.
 *
 * @param metrics The TestnetMetrics object.
 * @returns A number between 0 and 100 representing the noise penalty.
 */
const calculateNoisePenalty = (metrics: TestnetMetrics): number => {
  // noiseScore: An external signal indicating general spam, irrelevant activity,
  // or low-quality signals that could lead to false positives.
  // Why it matters: Helps filter out testnets that are simply too "noisy" to be profitable.
  // How this avoids false positives: Directly penalizes testnets with high external noise,
  // preventing the engine from wasting resources on low-quality environments.
  return clamp(metrics.noiseScore, 0, 100);
};

/**
 * Calculates the overall Rarity Score for a testnet based on various metrics.
 * The score ranges from 0 to 100 and classifies the testnet's opportunity profile.
 *
 * @param metrics The TestnetMetrics object.
 * @returns A structured result containing the rarity score, its breakdown, and classification.
 */
export const calculateRarityScore = (metrics: TestnetMetrics) => {
  // Calculate individual component scores
  const activityHealth = calculateActivityHealth(metrics);
  const contractDepth = calculateContractDepth(metrics);
  const saturation = calculateSaturation(metrics);
  const noise = calculateNoisePenalty(metrics);

  // Apply the main rarity score formula.
  // Why these weights: Activity and Contract Depth are positive indicators,
  // so they have higher positive weights. Saturation and Noise are negative indicators,
  // so they are subtracted (by using 100 - score) and have positive weights.
  // This ensures a balanced assessment of opportunity vs. risk/dilution.
  // How this avoids false positives: By heavily penalizing saturation and noise,
  // the score filters out testnets that might look good on activity/depth but are
  // actually overfarmed or full of spam.
  const rarityScore =
    (0.30 * activityHealth) +
    (0.30 * contractDepth) +
    (0.20 * (100 - saturation)) + // (100 - Saturation) because lower saturation is better
    (0.20 * (100 - noise));       // (100 - Noise) because lower noise is better

  // Determine classification based on the final rarity score
  let classification: "dead" | "early" | "prime" | "rare" | "overexposed";
  if (rarityScore < 30) {
    classification = "dead"; // Very low score, likely inactive or completely saturated.
  } else if (rarityScore >= 30 && rarityScore < 50) {
    classification = "early"; // Emerging, some activity but not yet mature or widely farmed.
  } else if (rarityScore >= 50 && rarityScore < 70) {
    classification = "prime"; // Good balance of activity, depth, and manageable saturation/noise.
  } else if (rarityScore >= 70 && rarityScore < 85) {
    classification = "rare"; // High potential, strong indicators, low saturation/noise.
  } else { // rarityScore >= 85
    classification = "overexposed"; // Exceptionally high score, might indicate an anomaly or a testnet that is about to be heavily farmed.
  }

  return {
    rarityScore: clamp(rarityScore, 0, 100), // Ensure final score is clamped
    breakdown: {
      activityHealth: clamp(activityHealth, 0, 100),
      contractDepth: clamp(contractDepth, 0, 100),
      saturation: clamp(saturation, 0, 100),
      noise: clamp(noise, 0, 100)
    },
    classification
  };
};