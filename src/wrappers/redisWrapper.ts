import Redis, { RedisOptions } from "ioredis";

type RedisClient = Redis;

export class RedisWrapper {
    private _client?: RedisClient;

    get client(): RedisClient {
        if (!this._client) throw new Error("Redis client not initialized");
        return this._client;
    }

    async connect(options: RedisOptions) {
        return new Promise<void>((resolve, reject) => {
            try {
                this._client = new Redis(options);

                this._client.once("ready", () => resolve());
                this._client.once("error", (err) => {
                    this._client = undefined;
                    reject(err);
                });
            } catch (error) {
                this._client = undefined;
                reject(error);
            }
        });
    }

    async disconnect() {
        return new Promise<void>((resolve, reject) => {
            if (!this._client) {
                reject(new Error("Cannot disconnect: Redis client not initialized"));
                return;
            }

            // If already disconnected, resolve immediately
            if (this._client.status === "end") {
                resolve();
                return;
            }

            this._client.quit()
                .then(() => {
                    this._client = undefined;
                    resolve();
                })
                .catch(reject);
        });
    }
}
