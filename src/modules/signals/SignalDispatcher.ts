// SignalDispatcher.ts
import crypto from 'crypto';
import { DatabaseService } from '../storage/DatabaseService'; // Import DatabaseService

// --- Input Interfaces (Copied from SignalAssembler for self-containment) ---

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
    chainId: string;
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

export class SignalDispatcher {
  private webhookUrl: string;
  private secretKey: string;
  private maxRetries: number = 3;
  private baseDelayMs: number = 1000; // 1 second
  private databaseService: DatabaseService; // Injected DatabaseService

  constructor(webhookUrl: string, secretKey: string, databaseService: DatabaseService) {
    this.webhookUrl = webhookUrl;
    this.secretKey = secretKey;
    this.databaseService = databaseService;
  }

  /**
   * Dispatches a Testnet Intelligence signal.
   * This involves validating the signal, persisting it to the database,
   * and optionally sending it to a webhook with HMAC signing.
   * @param signal The TestnetSignal object to dispatch.
   * @returns A promise that resolves when the signal has been processed (persisted and optionally emitted).
   */
  async dispatch(signal: TestnetSignal): Promise<void> {
    try {
      // 1. Validate signal integrity
      this.validateSignal(signal);
      console.log(`Validated signal ${signal.signalId}.`);

      // 2. Persistence: Store signal using the existing storage/database service
      await this.persistSignal(signal);
      console.log(`Signal ${signal.signalId} persisted to database.`);

      // 3. Emission: If WEBHOOK_URL exists in config, POST the signal payload
      if (this.webhookUrl) {
        await this.emitSignalToWebhook(signal);
      } else {
        console.warn(`Webhook URL not configured for SignalDispatcher. Skipping webhook emission for signal ${signal.signalId}.`);
      }

      // Always log signal summary to console/logger
      console.log(`Signal Summary [${signal.signalId}]: Type=${signal.type}, Chain=${signal.testnet.chainName}, Rarity=${signal.scores.rarityScore.toFixed(2)}, Classification=${signal.classification}, Severity=${signal.severity}`);

    } catch (error: any) {
      console.error(`Failed to dispatch signal ${signal.signalId}:`, error.message);
      throw new Error(`Signal dispatch failed for ${signal.signalId}: ${error.message}`);
    }
  }

  /**
   * Validates the structure and content of a TestnetSignal.
   * @param signal The signal to validate.
   * @throws Error if the signal is invalid.
   */
  private validateSignal(signal: TestnetSignal): void {
    const errors: string[] = [];

    if (typeof signal.signalId !== 'string' || signal.signalId.length === 0) {
      errors.push('signalId is required and must be a non-empty string.');
    }
    if (typeof signal.timestamp !== 'number' || isNaN(signal.timestamp)) {
      errors.push('timestamp is required and must be a number.');
    }
    if (!signal.testnet) {
      errors.push('testnet object is required.');
    } else {
      if (typeof signal.testnet.chainId !== 'string' || signal.testnet.chainId.length === 0) {
        errors.push('testnet.chainId is required and must be a non-empty string.');
      }
      if (typeof signal.testnet.chainName !== 'string' || signal.testnet.chainName.length === 0) {
        errors.push('testnet.chainName is required and must be a non-empty string.');
      }
    }
    if (!signal.scores) {
      errors.push('scores object is required.');
    } else {
      if (typeof signal.scores.rarityScore !== 'number' || signal.scores.rarityScore < 0 || signal.scores.rarityScore > 100) {
        errors.push('scores.rarityScore is required and must be a number between 0 and 100.');
      }
    }
    if (typeof signal.confidence !== 'number' || signal.confidence < 0 || signal.confidence > 1) {
      errors.push('confidence is required and must be a number between 0 and 1.');
    }

    const validClassifications = ["dead", "early", "prime", "rare", "overexposed"];
    if (!validClassifications.includes(signal.classification)) {
      errors.push(`classification must be one of: ${validClassifications.join(', ')}.`);
    }

    if (errors.length > 0) {
      throw new Error(`Signal validation failed for ${signal.signalId}: ${errors.join('; ')}`);
    }
  }

  /**
   * Persists the TestnetSignal to the database.
   * @param signal The signal to persist.
   */
  private async persistSignal(signal: TestnetSignal): Promise<void> {
    // Map TestnetSignal to SignalRecord for database storage
    const signalRecord = {
      id: signal.signalId,
      chain: signal.testnet.chainName, // Use chainName for the 'chain' field
      type: signal.type,
      context: signal, // Store the entire TestnetSignal object in context
      simulation: null, // TestnetSignal schema does not have a top-level simulation field
      score: signal.scores, // Store the scores object
      status: signal.classification, // Use classification as status
      detector: signal.metadata.source, // Use metadata.source as detector
    };

    await this.databaseService.saveSignal(signalRecord);
  }

  /**
   * Emits the signal to the configured webhook URL.
   * Includes retry logic with exponential backoff.
   * @param signal The signal to emit.
   */
  private async emitSignalToWebhook(signal: TestnetSignal): Promise<void> {
    const signalId = signal.signalId;
    const timestamp = signal.timestamp;

    // Sign the signal with HMAC-SHA256. Ensure the entire signal (including timestamp) is part of the signed payload.
    const signature = this.signSignal({ ...signal, timestamp });

    // Add the signature to the signal payload itself, as per architecture document
    const payloadToSend = { ...signal, timestamp, signed_header: signature };
    const payloadString = JSON.stringify(payloadToSend);

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        console.log(`Attempt ${i + 1}/${this.maxRetries} to emit signal ${signalId} to ${this.webhookUrl}`);
        
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-MEV-Signature': signature, // Custom header for webhook verification
          },
          body: payloadString,
        });

        if (response.ok) {
          console.log(`Signal ${signalId} emitted successfully on attempt ${i + 1}.`);
          return; // Success, exit function
        } else {
          const errorText = await response.text();
          console.error(`Failed to emit signal ${signalId} on attempt ${i + 1}. Status: ${response.status}, Response: ${errorText}`);
        }
      } catch (error: any) {
        console.error(`Error emitting signal ${signalId} on attempt ${i + 1}:`, error.message);
      }

      if (i < this.maxRetries - 1) {
        const delay = this.baseDelayMs * Math.pow(2, i); // Exponential backoff
        console.log(`Retrying signal ${signalId} in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error(`Failed to emit signal ${signalId} after ${this.maxRetries} attempts.`);
    throw new Error(`Failed to emit signal ${signalId} after ${this.maxRetries} attempts.`);
  }

  /**
   * Generates an HMAC-SHA256 signature for the signal payload.
   * @param signal The signal object to sign.
   * @returns The HMAC signature as a hexadecimal string.
   */
  private signSignal(signal: any): string {
    const payload = JSON.stringify(signal);
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(payload);
    return hmac.digest('hex');
  }
}