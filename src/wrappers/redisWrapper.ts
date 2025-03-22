import { createClient, RedisClientOptions } from "redis";

type RedisClient = ReturnType<typeof createClient>;

export class RedisWrapper {
    private _client?: RedisClient;

    get client(): RedisClient {
        if (!this._client) throw new Error("Redis client not initialized");
        return this._client;
    }

    async connect(options: RedisClientOptions) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                this._client = createClient(options);

                this._client.on("ready", () => resolve());
                this._client.on("error", (err) => {
                    // Reject and reset the client to prevent reuse of a faulty connection
                    this._client = undefined;
                    reject(err);
                });

                this._client.connect().catch((err) => {
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

            // If already disconnected (client is undefined), we resolve immediately
            if (this._client && !this._client.isOpen) {
                resolve();
                return;
            }

            try {
                this._client.quit().then(() => {
                    this._client = undefined; // Reset client after disconnect
                    resolve();
                }).catch(reject);
            } catch (error) {
                reject(error);
            }
        });
    }

}
