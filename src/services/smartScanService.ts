import { useToast } from '@/hooks/use-toast';

export interface ScanTarget {
  url: string;
  responseTime: number;
  statusCode: number;
  serverHeader?: string;
  contentLength?: number;
  errorRate: number;
  lastResponseTime: number;
}

export interface SmartScanConfig {
  mode: 'conservative' | 'adaptive' | 'aggressive';
  initialPayloadCount: number;
  maxPayloadCount: number;
  minPayloadCount: number;
  responseTimeThreshold: number;
  errorRateThreshold: number;
  adaptiveAdjustment: boolean;
}

export class SmartScanManager {
  private target: ScanTarget;
  private config: SmartScanConfig;
  private currentPayloadCount: number;
  private requestHistory: Array<{ timestamp: number; responseTime: number; success: boolean }> = [];
  private adaptiveDelayMs: number = 1000;

  constructor(targetUrl: string, mode: 'conservative' | 'adaptive' | 'aggressive' = 'adaptive') {
    this.target = {
      url: targetUrl,
      responseTime: 0,
      statusCode: 200,
      errorRate: 0,
      lastResponseTime: 0
    };

    this.config = this.getConfigForMode(mode);
    this.currentPayloadCount = this.config.initialPayloadCount;
  }

  private getConfigForMode(mode: 'conservative' | 'adaptive' | 'aggressive'): SmartScanConfig {
    const configs = {
      conservative: {
        mode: 'conservative' as const,
        initialPayloadCount: 3,
        maxPayloadCount: 10,
        minPayloadCount: 1,
        responseTimeThreshold: 2000, // 2 seconds
        errorRateThreshold: 0.1, // 10% error rate
        adaptiveAdjustment: false
      },
      adaptive: {
        mode: 'adaptive' as const,
        initialPayloadCount: 10,
        maxPayloadCount: 50,
        minPayloadCount: 3,
        responseTimeThreshold: 3000, // 3 seconds
        errorRateThreshold: 0.15, // 15% error rate
        adaptiveAdjustment: true
      },
      aggressive: {
        mode: 'aggressive' as const,
        initialPayloadCount: 25,
        maxPayloadCount: 100,
        minPayloadCount: 10,
        responseTimeThreshold: 5000, // 5 seconds
        errorRateThreshold: 0.25, // 25% error rate
        adaptiveAdjustment: false
      }
    };

    return configs[mode];
  }

  // Perform initial reconnaissance to assess target capabilities
  async performInitialRecon(): Promise<{ canProceed: boolean; recommendations: string[] }> {
    const recommendations: string[] = [];
    let canProceed = true;

    try {
      const startTime = Date.now();
      const response = await fetch(this.target.url, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'ABSpider/1.0 (Security Scanner)',
        }
      });

      const responseTime = Date.now() - startTime;
      this.target.responseTime = responseTime;
      this.target.statusCode = response.status;
      this.target.serverHeader = response.headers.get('server') || undefined;
      this.target.contentLength = parseInt(response.headers.get('content-length') || '0');

      // Analyze server characteristics
      if (responseTime > 5000) {
        recommendations.push('Target has slow response times - reducing payload count');
        this.currentPayloadCount = Math.max(this.config.minPayloadCount, Math.floor(this.currentPayloadCount * 0.5));
        this.adaptiveDelayMs = 3000;
      } else if (responseTime < 500) {
        recommendations.push('Target responds quickly - can handle more payloads');
        if (this.config.mode === 'adaptive') {
          this.currentPayloadCount = Math.min(this.config.maxPayloadCount, Math.floor(this.currentPayloadCount * 1.5));
        }
      }

      // Check for rate limiting indicators
      const rateLimitHeaders = [
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'retry-after',
        'x-rate-limit-limit'
      ];

      const hasRateLimit = rateLimitHeaders.some(header => response.headers.has(header));
      if (hasRateLimit) {
        recommendations.push('Rate limiting detected - enabling conservative mode');
        this.adaptiveDelayMs = 5000;
        this.currentPayloadCount = Math.min(this.currentPayloadCount, 5);
      }

      // Check for WAF/Security headers
      const securityHeaders = [
        'x-frame-options',
        'content-security-policy',
        'x-xss-protection',
        'strict-transport-security'
      ];

      const securityHeaderCount = securityHeaders.filter(header => response.headers.has(header)).length;
      if (securityHeaderCount >= 3) {
        recommendations.push('Strong security headers detected - using stealth approach');
        this.adaptiveDelayMs = Math.max(this.adaptiveDelayMs, 2000);
      }

      // Server-specific optimizations
      const serverHeader = this.target.serverHeader?.toLowerCase();
      if (serverHeader?.includes('cloudflare')) {
        recommendations.push('Cloudflare detected - adjusting for CDN behavior');
        this.adaptiveDelayMs = Math.max(this.adaptiveDelayMs, 1500);
      } else if (serverHeader?.includes('nginx')) {
        recommendations.push('Nginx server detected - optimizing for high performance');
      } else if (serverHeader?.includes('apache')) {
        recommendations.push('Apache server detected - standard configuration applied');
      }

    } catch (error) {
      recommendations.push('Target unreachable or blocking requests - aborting scan');
      canProceed = false;
    }

    return { canProceed, recommendations };
  }

  // Record response metrics for adaptive adjustment
  recordResponse(responseTime: number, success: boolean, statusCode?: number) {
    this.requestHistory.push({
      timestamp: Date.now(),
      responseTime,
      success
    });

    // Keep only last 50 requests for analysis
    if (this.requestHistory.length > 50) {
      this.requestHistory = this.requestHistory.slice(-50);
    }

    this.target.lastResponseTime = responseTime;
    
    // Calculate error rate from recent requests
    const recentRequests = this.requestHistory.slice(-20);
    this.target.errorRate = recentRequests.filter(r => !r.success).length / recentRequests.length;

    // Adaptive adjustment logic
    if (this.config.adaptiveAdjustment) {
      this.adjustPayloadCount();
      this.adjustDelay();
    }
  }

  private adjustPayloadCount() {
    const avgResponseTime = this.getAverageResponseTime();
    const errorRate = this.target.errorRate;

    // Reduce payload count if target is struggling
    if (avgResponseTime > this.config.responseTimeThreshold || errorRate > this.config.errorRateThreshold) {
      this.currentPayloadCount = Math.max(
        this.config.minPayloadCount,
        Math.floor(this.currentPayloadCount * 0.8)
      );
    }
    // Increase payload count if target is handling well
    else if (avgResponseTime < this.config.responseTimeThreshold * 0.5 && errorRate < this.config.errorRateThreshold * 0.5) {
      this.currentPayloadCount = Math.min(
        this.config.maxPayloadCount,
        Math.floor(this.currentPayloadCount * 1.2)
      );
    }
  }

  private adjustDelay() {
    const avgResponseTime = this.getAverageResponseTime();
    const errorRate = this.target.errorRate;

    // Increase delay if target is struggling
    if (avgResponseTime > this.config.responseTimeThreshold || errorRate > this.config.errorRateThreshold) {
      this.adaptiveDelayMs = Math.min(10000, this.adaptiveDelayMs * 1.5);
    }
    // Decrease delay if target is handling well
    else if (avgResponseTime < this.config.responseTimeThreshold * 0.3 && errorRate < 0.05) {
      this.adaptiveDelayMs = Math.max(500, this.adaptiveDelayMs * 0.8);
    }
  }

  private getAverageResponseTime(): number {
    if (this.requestHistory.length === 0) return 0;
    
    const recentRequests = this.requestHistory.slice(-10);
    const sum = recentRequests.reduce((acc, req) => acc + req.responseTime, 0);
    return sum / recentRequests.length;
  }

  // Get current scan parameters
  getCurrentScanParams() {
    return {
      payloadCount: this.currentPayloadCount,
      delayMs: this.adaptiveDelayMs,
      mode: this.config.mode,
      targetHealth: this.getTargetHealthStatus(),
      recommendations: this.getRecommendations()
    };
  }

  private getTargetHealthStatus(): 'healthy' | 'stressed' | 'overloaded' {
    const avgResponseTime = this.getAverageResponseTime();
    const errorRate = this.target.errorRate;

    if (errorRate > this.config.errorRateThreshold || avgResponseTime > this.config.responseTimeThreshold) {
      return 'overloaded';
    } else if (errorRate > this.config.errorRateThreshold * 0.5 || avgResponseTime > this.config.responseTimeThreshold * 0.7) {
      return 'stressed';
    }
    return 'healthy';
  }

  private getRecommendations(): string[] {
    const recommendations: string[] = [];
    const health = this.getTargetHealthStatus();

    switch (health) {
      case 'overloaded':
        recommendations.push('Target is overloaded - reducing scan intensity');
        recommendations.push('Consider running scan during off-peak hours');
        break;
      case 'stressed':
        recommendations.push('Target showing stress - monitoring closely');
        recommendations.push('Scan will auto-adjust if conditions worsen');
        break;
      case 'healthy':
        recommendations.push('Target responding well - maintaining current pace');
        break;
    }

    return recommendations;
  }

  // Get delay before next request
  getAdaptiveDelay(): number {
    return this.adaptiveDelayMs;
  }

  // Check if scan should continue
  shouldContinueScan(): boolean {
    const health = this.getTargetHealthStatus();
    
    // Always continue for healthy targets
    if (health === 'healthy') return true;
    
    // For stressed targets, continue but with caution
    if (health === 'stressed') return true;
    
    // For overloaded targets, check if we're in aggressive mode
    if (health === 'overloaded') {
      return this.config.mode === 'aggressive';
    }
    
    return true;
  }
}

// Factory function to create smart scan manager
export const createSmartScanManager = (targetUrl: string, mode: 'conservative' | 'adaptive' | 'aggressive' = 'adaptive'): SmartScanManager => {
  return new SmartScanManager(targetUrl, mode);
};

// Utility function to get recommended payload counts based on target analysis
export const getRecommendedPayloadCounts = (
  targetUrl: string, 
  mode: 'conservative' | 'adaptive' | 'aggressive',
  maxPayloads: { sqli: number; xss: number; lfi: number }
) => {
  const manager = new SmartScanManager(targetUrl, mode);
  const params = manager.getCurrentScanParams();
  
  const ratio = params.payloadCount / 25; // Base ratio
  
  return {
    sqli: Math.min(maxPayloads.sqli, Math.max(1, Math.floor(maxPayloads.sqli * ratio))),
    xss: Math.min(maxPayloads.xss, Math.max(1, Math.floor(maxPayloads.xss * ratio))),
    lfi: Math.min(maxPayloads.lfi, Math.max(1, Math.floor(maxPayloads.lfi * ratio)))
  };
};