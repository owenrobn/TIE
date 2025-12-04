// SignalDispatcher.ts
import crypto from 'crypto';

export class SignalDispatcher {
  private webhookUrl: string;
  private secretKey: string;

  constructor(webhookUrl: string, secretKey: string) {
    this.webhookUrl = webhookUrl;
    this.secretKey = secretKey;
  }

  async dispatch(signal: any): Promise<void> {
    // Sign the signal with HMAC-SHA256
    const signature = this.signSignal(signal);
    
    try {
      // In a real implementation, this would send an HTTP request
      console.log('Dispatching signal:', signal);
      console.log('Signature:', signature);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('Signal dispatched successfully');
    } catch (error) {
      console.error('Failed to dispatch signal:', error);
      throw error;
    }
  }

  private signSignal(signal: any): string {
    const payload = JSON.stringify(signal);
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(payload);
    return hmac.digest('hex');
  }
}