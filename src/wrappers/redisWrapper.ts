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
                this._client.on("error", (err) => reject(err));
                await this._client.connect();
            } catch (error) {
                reject(error);
            }
        });
    }

    async disconnect() {
        return new Promise<void>(async (resolve, reject) => {
            try {
                await this._client?.quit();
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
};