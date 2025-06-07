import { Lambda, LambdaClientConfig } from '@aws-sdk/client-lambda';
import * as lambdaLibrary from '@aws-sdk/client-lambda';

export class LambdaWrapper {
    private _clients = new Map<string, Lambda>();

    getLambdaLibrary() {
        return lambdaLibrary;
    }

    async connect(config: LambdaClientConfig, regions: string[]) {
        try {
            for (const region of regions) {
                const lambda = new Lambda({ ...config, region });
                this._clients.set(region, lambda);
            }
        } catch (error) {
            throw new Error(`Error while connecting to the Lambda regions. ${error}`);
        }
    }

    getClient(region: string) {
        if (!this._clients.has(region)) throw new Error(`Cannot access Lambda client for ${region} before connecting`);
        return this._clients.get(region);
    }

    async destroy(regions: string[]) {
        try {
            for (const region of regions) {
                if (this._clients.has(region)) {
                    const client = this._clients.get(region);
                    if (client) {
                        client.destroy();
                        this._clients.delete(region);
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }

}