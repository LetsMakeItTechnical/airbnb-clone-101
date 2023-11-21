import { CacheService } from '.';

export class CacheManager {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService();
  }

  async getDataFromCache<T>(key: string): Promise<T | null> {
    const cachedData = await this.cacheService.get(key);

    if (!cachedData) return null;

    return JSON.parse(cachedData);
  }

  async setCache<T>(key: string, value: string): Promise<void> {
    this.cacheService.set(key, value);
  }
}
