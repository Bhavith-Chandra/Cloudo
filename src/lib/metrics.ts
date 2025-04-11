interface Metric {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

interface Counter extends Metric {
  type: 'counter';
}

interface Gauge extends Metric {
  type: 'gauge';
}

interface Histogram extends Metric {
  type: 'histogram';
  buckets: number[];
}

type MetricType = Counter | Gauge | Histogram;

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, MetricType[]> = new Map();
  private readonly maxMetricsPerName = 1000;

  private constructor() {}

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  public increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.addMetric({
      type: 'counter',
      name,
      value,
      timestamp: new Date(),
      labels,
    });
  }

  public setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.addMetric({
      type: 'gauge',
      name,
      value,
      timestamp: new Date(),
      labels,
    });
  }

  public observeHistogram(
    name: string,
    value: number,
    buckets: number[] = [0.1, 0.5, 1, 2.5, 5, 10],
    labels?: Record<string, string>
  ): void {
    this.addMetric({
      type: 'histogram',
      name,
      value,
      timestamp: new Date(),
      buckets,
      labels,
    });
  }

  public getMetrics(name?: string): MetricType[] {
    if (name) {
      return this.metrics.get(name) || [];
    }

    const allMetrics: MetricType[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics;
  }

  public clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  public getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }

  private addMetric(metric: MetricType): void {
    const metrics = this.metrics.get(metric.name) || [];
    metrics.push(metric);

    // Keep only the most recent metrics
    if (metrics.length > this.maxMetricsPerName) {
      metrics.splice(0, metrics.length - this.maxMetricsPerName);
    }

    this.metrics.set(metric.name, metrics);
  }

  public getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {};

    for (const [name, metrics] of this.metrics.entries()) {
      const values = metrics.map(m => m.value);
      const latest = metrics[metrics.length - 1];

      summary[name] = {
        count: metrics.length,
        latest: latest?.value,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        type: latest?.type,
      };

      if (latest?.type === 'histogram') {
        summary[name].buckets = latest.buckets;
      }
    }

    return summary;
  }

  public exportMetrics(): string {
    const lines: string[] = [];

    for (const [name, metrics] of this.metrics.entries()) {
      const latest = metrics[metrics.length - 1];
      if (!latest) continue;

      const labels = latest.labels
        ? Object.entries(latest.labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(',')
        : '';

      const metricName = labels ? `${name}{${labels}}` : name;
      lines.push(`# TYPE ${name} ${latest.type}`);
      lines.push(`${metricName} ${latest.value}`);
    }

    return lines.join('\n');
  }
}

export const metrics = MetricsCollector.getInstance(); 