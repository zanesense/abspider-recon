import { fetchWithBypass, CORSBypassMetadata, FetchWithBypassResult } from './corsProxy';

interface RequestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  status?: number;
  error?: string;
  corsMetadata?: CORSBypassMetadata;
  isError: boolean; // Added for easier error rate calculation
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
  private minRequestInterval = 200; // Default minimum interval between requests
  private recentMetrics: RequestMetrics[] = [];
  private metricsBufferSize = 50; // Keep last 50 requests for performance calculation

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
      ...fetchOptions
    } = options;

    const requestId = `${Date.now()}_${Math.random()}`;
    const abortController = new AbortController();
    
    this.activeRequests.set(requestId, abortController);

    const metrics: RequestMetrics = {
      startTime: Date.now(),
      isError: false, // Default to no error
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

        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...(fetchOptions.headers as Record<string, string> || {}),
        };

        const fetchResult: FetchWithBypassResult = await fetchWithBypass(url, {
          method: fetchOptions.method,
          headers: headers,
          body: fetchOptions.body as string,
          timeout,
          signal: combinedSignal,
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

        if (error.name === 'AbortError' || this.scanController?.signal.aborted) {
          this.activeRequests.delete(requestId);
          throw new Error('Request aborted');
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
}

export function createRequestManager(scanController?: AbortController): RequestManager {
  return new RequestManager(scanController);
}