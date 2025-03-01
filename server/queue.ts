import { EventEmitter } from "events";

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  retryCount: number;
}

interface RequestQueueConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxConcurrent?: number;
  minDelayBetweenRequests?: number;
}

type QueueError = Error & {
  status?: number;
  code?: string;
};

export class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private maxRetries: number;
  private baseDelay: number;
  private minDelayBetweenRequests: number;
  private lastRequestTime: number = 0;
  private events = new EventEmitter();

  constructor(config: RequestQueueConfig = {}) {
    this.maxRetries = config.maxRetries ?? 3;
    this.baseDelay = config.baseDelay ?? 1000;
    this.minDelayBetweenRequests = config.minDelayBetweenRequests ?? 500;
  }

  async add<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute,
        resolve,
        reject,
        retryCount: 0,
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const request = this.queue.shift()!;

    try {
      // Ensure minimum delay between requests
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelayBetweenRequests) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minDelayBetweenRequests - timeSinceLastRequest)
        );
      }

      this.lastRequestTime = Date.now();
      const result = await request.execute();
      request.resolve(result);

      this.events.emit('requestSuccess', {
        queueLength: this.queue.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const queueError = error as QueueError;
      console.error("Request error:", {
        status: queueError.status,
        message: queueError.message,
        code: queueError.code,
        retryCount: request.retryCount
      });

      if (
        queueError.status === 429 || 
        (queueError.status && queueError.status >= 500) &&
        request.retryCount < this.maxRetries
      ) {
        const delay = this.calculateBackoff(request.retryCount);
        request.retryCount++;

        console.log(`Retrying request after ${delay}ms (attempt ${request.retryCount})`);

        // Put the request back in the queue after delay
        setTimeout(() => {
          this.queue.unshift(request);
          this.processing = false;
          this.processQueue();
        }, delay);

        this.events.emit('requestRetry', {
          error: queueError,
          retryCount: request.retryCount,
          delay,
          timestamp: new Date().toISOString()
        });

        return;
      }

      request.reject(this.enhanceError(queueError));
      this.events.emit('requestError', {
        error: queueError,
        timestamp: new Date().toISOString()
      });
    }

    this.processing = false;
    this.processQueue();
  }

  private calculateBackoff(retryCount: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.baseDelay * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.3 * baseDelay; // Add up to 30% jitter
    return Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds
  }

  private enhanceError(error: QueueError): Error {
    if (error.status === 429) {
      return new Error("Rate limit exceeded. Please try again later.");
    } else if (error.status >= 500) {
      return new Error("Server error. Please try again in a moment.");
    }
    return error;
  }

  // Monitoring methods
  get length() {
    return this.queue.length;
  }

  get isProcessing() {
    return this.processing;
  }

  on(event: 'requestSuccess' | 'requestError' | 'requestRetry', listener: (data: any) => void) {
    this.events.on(event, listener);
    return this;
  }
}

// Create a singleton instance with conservative settings
export const requestQueue = new RequestQueue({
  maxRetries: 3,
  baseDelay: 2000, // Start with 2 second delay
  minDelayBetweenRequests: 1000 // Minimum 1 second between requests
});

// Set up monitoring
requestQueue.on('requestError', (data) => {
  console.error('Request failed:', data);
});

requestQueue.on('requestRetry', (data) => {
  console.log('Retrying request:', data);
});