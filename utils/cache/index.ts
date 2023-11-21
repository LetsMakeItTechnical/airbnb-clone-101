import Redis from 'ioredis';

export class CacheService {
  private cacheClient: Redis;

  constructor() {
    // {
    //   port: +process.env.REDIS_PORT!, // Redis port
    //   host: process.env.REDIS_HOST!, // Redis host
    // }
    this.cacheClient = new Redis(process.env.REDIS_URL!);
    this.initialize();
  }

  private initialize(): void {
    this.cacheClient.on('error', (error: Error) => {
      console.error(error);
      void this.cacheClient.quit();
    });
  }

  public async set(
    key: string | Buffer,
    value: string | Buffer | number,
    EX = 3600
  ): Promise<void> {
    try {
      await this.cacheClient.set(key, value, 'EX', EX);
    } catch (error) {
      console.error(error);
    }
  }

  public async get(key: string | Buffer): Promise<string | null> {
    let result = null;

    try {
      result = await this.cacheClient.get(key);
    } catch (error) {
      console.error(error);
    }

    return result;
  }
}
