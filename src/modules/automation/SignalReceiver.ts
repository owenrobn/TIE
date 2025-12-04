// SignalReceiver.ts
import crypto from 'crypto';

export class SignalReceiver {
  private tieSecretKey: string;
  private lastSignalTimestamp: string | null;

  constructor(tieSecretKey: string) {
    this.tieSecretKey = tieSecretKey;
    this.lastSignalTimestamp = null;
  }

  verifySignal(signalPayload: any, signature: string): boolean {
    const payloadString = JSON.stringify(signalPayload);
    const hmac = crypto.createHmac('sha256', this.tieSecretKey);
    hmac.update(payloadString);
    const expectedSignature = hmac.digest('hex');

    if (expectedSignature === signature) {
      this.lastSignalTimestamp = new Date().toISOString();
      return true;
    }
    return false;
  }

  getLastSignalTimestamp(): string | null {
    return this.lastSignalTimestamp;
  }
}