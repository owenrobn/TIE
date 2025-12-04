// ExecutionQueue.ts
interface QueuedSignal {
  signal: any;
  priority: number; // Higher number = higher priority
  addedAt: Date;
  retries: number;
  lastAttempt?: Date;
  error?: string;
}

export class ExecutionQueue {
  private queue: QueuedSignal[];
  private failedQueue: QueuedSignal[];
  private maxRetries: number;

  constructor(maxRetries: number = 3) {
    this.queue = [];
    this.failedQueue = [];
    this.maxRetries = maxRetries;
  }

  add(signal: any, priority: number = 0): void {
    const existing = this.queue.find(item => item.signal.signal_id === signal.signal_id);
    if (existing) {
      console.log(`Signal ${signal.signal_id} already in queue, updating priority.`);
      existing.priority = Math.max(existing.priority, priority);
      this.sortQueue();
      return;
    }

    this.queue.push({
      signal,
      priority,
      addedAt: new Date(),
      retries: 0,
    });
    this.sortQueue();
    console.log(`Signal ${signal.signal_id} added to queue with priority ${priority}.`);
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority || a.addedAt.getTime() - b.addedAt.getTime());
  }

  getNext(): any | null {
    if (this.queue.length === 0) {
      return null;
    }
    // For simplicity, just take the highest priority. In a real system,
    // you might also consider cooldowns or wallet availability.
    return this.queue.shift()?.signal;
  }

  getById(signalId: string): any | null {
    const index = this.queue.findIndex(item => item.signal.signal_id === signalId);
    if (index !== -1) {
      return this.queue[index].signal;
    }
    return null;
  }

  remove(signalId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.signal.signal_id !== signalId);
    return this.queue.length < initialLength;
  }

  addFailed(signal: any, error: string): void {
    const existingIndex = this.failedQueue.findIndex(item => item.signal.signal_id === signal.signal_id);

    if (existingIndex !== -1) {
      const failedItem = this.failedQueue[existingIndex];
      failedItem.retries++;
      failedItem.lastAttempt = new Date();
      failedItem.error = error;

      if (failedItem.retries <= this.maxRetries) {
        console.warn(`Retrying signal ${signal.signal_id}. Attempt ${failedItem.retries}/${this.maxRetries}`);
        // Re-add to main queue with exponential backoff (simulated)
        setTimeout(() => this.add(signal, failedItem.priority), failedItem.retries * 5000);
      } else {
        console.error(`Signal ${signal.signal_id} failed after ${this.maxRetries} retries. Moving to dead-letter.`);
        // Keep in failedQueue as dead-letter
      }
    } else {
      // First failure
      this.failedQueue.push({
        signal,
        priority: signal.score?.final || 0,
        addedAt: new Date(),
        retries: 1,
        lastAttempt: new Date(),
        error,
      });
      console.warn(`Signal ${signal.signal_id} failed for the first time. Will retry.`);
      setTimeout(() => this.add(signal, signal.score?.final || 0), 5000); // Retry after 5 seconds
    }
  }

  size(): number {
    return this.queue.length;
  }

  failedSize(): number {
    return this.failedQueue.length;
  }

  getFailedSignals(): QueuedSignal[] {
    return this.failedQueue;
  }
}