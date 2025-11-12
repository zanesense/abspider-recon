interface RequestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  error?: string;
}

interface RequestManagerOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class RequestManager {
  private activeRequests: Map<string, AbortController> = new Map();
  private requestMetrics: Map<string, RequestMetrics> = new Map();
  private rateLimiter: Map<string, number> = new Map();
  private minRequestInterval = 200;

  constructor(private scanController?: AbortController) {}

  async fetch(
    url: string,
    options: RequestManagerOptions = {}
  ): Promise<Response> {
    const {
      timeout = 10000,
      retries = 2,
      retryDelay = 1000,
      ...fetchOptions
    } = options;

    const requestId = `${Date.now()}_${Math.random()}`;
    const abortController = new AbortController();
    
    this.activeRequests.set(requestId, abortController);

    const metrics: RequestMetrics = {
      startTime: Date.now(),
    };
    this.requestMetrics.set(requestId, metrics);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      if (this.scanController?.signal.aborted || abortController.signal.aborted) {
        throw new Error('Request aborted by scan controller');
      }

      let timeoutId: NodeJS.Timeout | null = null;

      try {
        await this.rateLimit(url);

        timeoutId = setTimeout(() => abortController.abort(), timeout);
        
        const combinedSignal = this.createCombinedSignal([
          this.scanController?.signal,
          abortController.signal,
        ].filter(Boolean) as AbortSignal[]);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: combinedSignal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            ...fetchOptions.headers,
          },
        });

        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.status = response.status;

        this.activeRequests.delete(requestId);
        return response;
      } catch (error: any) {
        lastError = error;

        if (error.name === 'AbortError' || this.scanController?.signal.aborted) {
          this.activeRequests.delete(requestId);
          throw new Error('Request aborted');
        }

        if (attempt < retries) {
          console.warn(`[RequestManager] Retry ${attempt + 1}/${retries} for ${url}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      } finally {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
      }
    }

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.error = lastError?.message;

    this.activeRequests.delete(requestId);
    throw lastError || new Error('Request failed after retries');
  }

  private createCombinedSignal(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    return controller.signal;
  }

  private async rateLimit(url: string): Promise<void> {
    const domain = new URL(url).hostname;
    const lastRequest = this.rateLimiter.get(domain) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.rateLimiter.set(domain, Date.now());
  }

  abortAll(): void {
    console.log(`[RequestManager] Aborting ${this.activeRequests.size} active requests`);
    for (const controller of this.activeRequests.values()) {
      controller.abort();
    }
    this.activeRequests.clear();
  }

  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  getMetrics(): RequestMetrics[] {
    return Array.from(this.requestMetrics.values());
  }

  setMinRequestInterval(ms: number): void {
    this.minRequestInterval = ms;
  }
}

export function createRequestManager(scanController?: AbortController): RequestManager {
  return new RequestManager(scanController);
}
