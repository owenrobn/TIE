// SignalDispatcher.ts
import crypto from 'crypto';

export class SignalDispatcher {
  private webhookUrl: string;
  private secretKey: string;
  private maxRetries: number = 3;
  private baseDelayMs: number = 1000; // 1 second

  constructor(webhookUrl: string, secretKey: string) {
    this.webhookUrl = webhookUrl;
    this.secretKey = secretKey;
  }

  async emitSignal(signal: any): Promise<void> { // Renamed from dispatch to emitSignal
    if (!this.webhookUrl) {
      console.warn('Webhook URL not configured for SignalDispatcher. Skipping dispatch.');
      return;
    }

    const signalId = signal.id; // Assuming 'id' is already attached by TIEEngine
    const timestamp = signal.timestamp; // Assuming 'timestamp' is already attached by TIEEngine

    // Sign the signal with HMAC-SHA256. Ensure the entire signal (including timestamp) is part of the signed payload.
    const signature = this.signSignal({ ...signal, timestamp });

    // Add the signature to the signal payload itself, as per architecture document
    const payloadToSend = { ...signal, timestamp, signed_header: signature };
    const payloadString = JSON.stringify(payloadToSend);

    for (let i = 0; i < this.maxRetries; i++) {
      try {
        console.log(`Attempt ${i + 1}/${this.maxRetries} to dispatch signal ${signalId} to ${this.webhookUrl}`);
        
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-MEV-Signature': signature, // Custom header for webhook verification
          },
          body: payloadString,
        });

        if (response.ok) {
          console.log(`Signal ${signalId} dispatched successfully on attempt ${i + 1}.`);
          return; // Success, exit function
        } else {
          const errorText = await response.text();
          console.error(`Failed to dispatch signal ${signalId} on attempt ${i + 1}. Status: ${response.status}, Response: ${errorText}`);
        }
      } catch (error: any) {
        console.error(`Error dispatching signal ${signalId} on attempt ${i + 1}:`, error.message);
      }

      if (i < this.maxRetries - 1) {
        const delay = this.baseDelayMs * Math.pow(2, i); // Exponential backoff
        console.log(`Retrying signal ${signalId} in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    console.error(`Failed to dispatch signal ${signalId} after ${this.maxRetries} attempts.`);
    throw new Error(`Failed to dispatch signal ${signalId} after ${this.maxRetries} attempts.`);
  }

  private signSignal(signal: any): string {
    const payload = JSON.stringify(signal);
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(payload);
    return hmac.digest('hex');
  }
}