export class SimpleCache {
  private static store = new Map<string, { data: unknown; expiresAt: number }>();

  static get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  static set(key: string, data: unknown, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  static del(key: string): void {
    this.store.delete(key);
  }
}
