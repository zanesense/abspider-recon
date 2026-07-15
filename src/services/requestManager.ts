import { fetchWithBypass, CORSBypassMetadata, FetchWithBypassResult } from './corsProxy';

interface RequestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  error?: string;
  corsMetadata?: CORSBypassMetadata;
  isError: boolean;
}

interface RequestManagerOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipProxy?: boolean;
}

// Module-level rate limiter shared across all scans for domain-level throttling
const _globalRateLimiter = new Map<string, number>();

export class RequestManager {
  private activeRequests: Map<string, AbortController> = new Map();
  private requestMetrics: Map<string, RequestMetrics> = new Map();
  private minRequestInterval = 200;
  private recentMetrics: RequestMetrics[] = [];
  private metricsBufferSize = 50;
  private moduleAbortController = new AbortController();

  public scanController?: AbortController; 

  constructor(scanController?: AbortController) {
    this.scanController = scanController;
  }

  async fetch(
    url: string,
    options: RequestManagerOptions = {}
  ): Promise<Response> {
    const {
      timeout = 10000,
      retries = 2,
      retryDelay = 1000,
      skipProxy = false,
      ...fetchOptions
    } = options;

    const requestId = `${Date.now()}_${Math.random()}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const attemptController = new AbortController();
      this.activeRequests.set(requestId, attemptController);
      const metrics: RequestMetrics = {
        startTime: Date.now(),
        isError: false,
      };
      this.requestMetrics.set(requestId, metrics);
      if (this.isAborted()) {
        throw new Error('Request aborted by scan controller');
      }

      let timeoutId: NodeJS.Timeout | null = null;

      try {
        await this.rateLimit(url);

        timeoutId = setTimeout(() => attemptController.abort(), timeout);
        
        const combinedSignal = this.createCombinedSignal([
          this.scanController?.signal,
          this.moduleAbortController.signal,
          attemptController.signal,
        ].filter(Boolean) as AbortSignal[]);

        const requestHeaders = (fetchOptions.headers as Record<string, string> || {});
        const headers: Record<string, string> = skipProxy
          ? requestHeaders
          : {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              ...requestHeaders,
            };

        const fetchResult: FetchWithBypassResult = await fetchWithBypass(url, {
          method: fetchOptions.method,
          headers: headers,
          body: fetchOptions.body as string,
          timeout,
          signal: combinedSignal,
          skipProxy,
          redirect: fetchOptions.redirect,
        });

        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.status = fetchResult.response.status;
        metrics.corsMetadata = fetchResult.metadata;
        metrics.isError = !fetchResult.response.ok; // Mark as error if response not ok

        this.activeRequests.delete(requestId);
        return fetchResult.response;
      } catch (error: any) {
        lastError = error;

        if (this.isAborted()) {
          this.activeRequests.delete(requestId);
          throw new Error('Request aborted', { cause: error });
        }
        if (attemptController.signal.aborted) {
          lastError = new Error(`Request timed out after ${timeout}ms`, { cause: error });
        }

        metrics.endTime = Date.now();
        metrics.duration = metrics.endTime - metrics.startTime;
        metrics.error = lastError?.message;
        metrics.isError = true; // Mark as error

        if (attempt < retries) {
          console.warn(`[RequestManager] Retry ${attempt + 1}/${retries} for ${url}`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      } finally {
        if (timeoutId !== null) {
          clearTimeout(timeoutId);
        }
        // Add to recentMetrics buffer regardless of success or failure
        this.recentMetrics.push(metrics);
        if (this.recentMetrics.length > this.metricsBufferSize) {
          this.recentMetrics.shift(); // Remove oldest metric
        }
      }
    }

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
    let domain: string;
    try {
      domain = new URL(url).hostname;
    } catch {
      domain = url;
    }
    const lastRequest = _globalRateLimiter.get(domain) || 0;
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequest;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const delay = this.minRequestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    _globalRateLimiter.set(domain, Date.now());
  }

  abortAll(): void {
    console.log(`[RequestManager] Aborting ${this.activeRequests.size} active requests`);
    this.moduleAbortController.abort();
    for (const controller of this.activeRequests.values()) {
      controller.abort();
    }
    this.activeRequests.clear();
  }

  resetModuleAbortController(): void {
    if (this.moduleAbortController.signal.aborted) {
      this.moduleAbortController = new AbortController();
    }
  }

  getAbortSignal(): AbortSignal | undefined {
    if (!this.scanController?.signal) {
      return this.moduleAbortController.signal;
    }
    return this.createCombinedSignal([
      this.scanController.signal,
      this.moduleAbortController.signal,
    ]);
  }

  isAborted(): boolean {
    return Boolean(this.scanController?.signal.aborted || this.moduleAbortController.signal.aborted);
  }

  getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  getMetrics(): RequestMetrics[] {
    return Array.from(this.requestMetrics.values());
  }

  // New method to get performance metrics (rolling average)
  getPerformanceMetrics(): { avgResponseTime: number; errorRate: number; totalRequests: number } {
    if (this.recentMetrics.length === 0) {
      return { avgResponseTime: 0, errorRate: 0, totalRequests: 0 };
    }

    const totalDuration = this.recentMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const errorCount = this.recentMetrics.filter(m => m.isError).length;

    return {
      avgResponseTime: totalDuration / this.recentMetrics.length,
      errorRate: (errorCount / this.recentMetrics.length) * 100,
      totalRequests: this.recentMetrics.length,
    };
  }

  // New method to adjust minRequestInterval
  adjustMinRequestInterval(newInterval: number): void {
    this.minRequestInterval = Math.max(50, newInterval); // Ensure a minimum interval of 50ms
    console.log(`[RequestManager] Adjusted minRequestInterval to: ${this.minRequestInterval}ms`);
  }

  getMinRequestInterval(): number {
    return this.minRequestInterval;
  }

  getMetricsBufferSize(): number {
    return this.metricsBufferSize;
  }
}

export function createRequestManager(scanController?: AbortController): RequestManager {
  return new RequestManager(scanController);
}
