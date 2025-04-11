interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  private cache: Map<string, CacheItem<T>> = new Map();
  private defaultTTL: number;

  constructor(defaultTTL: number = 60 * 1000) {
    this.defaultTTL = defaultTTL;
  }

  public set(key: string, value: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { value, expiresAt });
  }

  public get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  public size(): number {
    return this.cache.size;
  }

  public keys(): string[] {
    return Array.from(this.cache.keys());
  }

  public values(): T[] {
    return Array.from(this.cache.values()).map(item => item.value);
  }

  public entries(): [string, T][] {
    return Array.from(this.cache.entries()).map(([key, item]) => [key, item.value]);
  }

  public cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
const cache = new Cache();

export default cache; 