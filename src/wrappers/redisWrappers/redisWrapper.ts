import Redis, { RedisOptions } from "ioredis";

type RedisClient = Redis;

export class RedisWrapper {
    private _client?: RedisClient;
    private _subscriber?: RedisClient;

    get client(): RedisClient {
        if (!this._client) throw new Error("Redis client not initialized");
        return this._client;
    }

    async connect(options: RedisOptions) {
        return new Promise<void>((resolve, reject) => {
            try {
                this._client = new Redis(options);
                this._subscriber = new Redis(options); // separate connection for Pub/Sub

                this._client.once("ready", () => resolve());
                this._client.once("error", (err) => {
                    this._client = undefined;
                    this._subscriber = undefined;
                    reject(err);
                });
            } catch (error) {
                this._client = undefined;
                this._subscriber = undefined;
                reject(error);
            }
        });
    }

    async disconnect() {
        if (this._client) {
            await this._client.quit();
            this._client = undefined;
        }
        if (this._subscriber) {
            await this._subscriber.quit();
            this._subscriber = undefined;
        }
    }

    async subscribe(channel: string, messageHandler: (message: string) => void) {
        if (!this._subscriber) throw new Error("Redis subscriber not initialized");

        await this._subscriber.subscribe(channel);

        this._subscriber.on("message", (chan, message) => {
            if (chan === channel) {
                messageHandler(message);
            }
        });
    }
}
