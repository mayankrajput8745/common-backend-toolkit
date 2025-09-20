import Redis, { RedisOptions } from "ioredis";

type Callback<T = any> = (message: T, channel: string) => void;

export class RedisPubSubWrapper {
  private static _instance: RedisPubSubWrapper;

  private _client?: Redis;       // publisher
  private _subscriber?: Redis;   // subscriber
  private _subscriptions: Map<string, Set<Callback>> = new Map();
  private _isConnected = false;
  private _options?: RedisOptions;

  private constructor() {}

  /** Singleton */
  public static getInstance(): RedisPubSubWrapper {
    if (!this._instance) {
      this._instance = new RedisPubSubWrapper();
    }
    return this._instance;
  }

  /** Connect both publisher and subscriber */
  public async connect(options: RedisOptions): Promise<void> {
    if (this._isConnected) return;

    this._options = options;
    this._client = new Redis(options);
    this._subscriber = new Redis(options);

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        this._client!.once("ready", resolve);
        this._client!.once("error", reject);
      }),
      new Promise<void>((resolve, reject) => {
        this._subscriber!.once("ready", resolve);
        this._subscriber!.once("error", reject);
      }),
    ]);

    this._subscriber.on("message", (channel, message) => {
      const callbacks = this._subscriptions.get(channel);
      if (!callbacks) return;

      let payload: any = message;
      try { payload = JSON.parse(message); } catch {}

      callbacks.forEach(cb => {
        try {
          cb(payload, channel);
        } catch (err) {
          // Log or handle callback errors in your logger instead of console.log
        }
      });
    });

    this._isConnected = true;
  }

  /** Auto-connect helper */
  private async ensureConnected() {
    if (!this._isConnected) {
      if (!this._options) throw new Error("Redis not connected and no options available");
      await this.connect(this._options);
    }
  }

  /** Publish a message */
  public async publish<T = any>(channel: string, message: T): Promise<void> {
    await this.ensureConnected();
    const payload = typeof message === "string" ? message : JSON.stringify(message);
    await this._client!.publish(channel, payload);
  }

  /** Subscribe to a channel */
  public async subscribe<T = any>(
    channel: string,
    callback: Callback<T>
  ): Promise<() => Promise<void>> {
    await this.ensureConnected();

    if (!this._subscriptions.has(channel)) {
      this._subscriptions.set(channel, new Set());
      await this._subscriber!.subscribe(channel);
    }

    const callbacks = this._subscriptions.get(channel)!;
    callbacks.add(callback);

    // Return unsubscribe function
    return async () => {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        await this._subscriber!.unsubscribe(channel);
        this._subscriptions.delete(channel);
      }
    };
  }

  /** Disconnect both clients */
  public async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.quit();
      this._client = undefined;
    }
    if (this._subscriber) {
      await this._subscriber.quit();
      this._subscriber = undefined;
    }
    this._subscriptions.clear();
    this._isConnected = false;
  }

  /** Expose client (if needed) */
  public get client(): Redis {
    if (!this._client) throw new Error("Redis client not connected");
    return this._client;
  }

  public get isConnected(): boolean {
    return this._isConnected;
  }
}

// Export singleton
const redisPubSubWrapper = RedisPubSubWrapper.getInstance();
export default redisPubSubWrapper;
export type { Callback };
