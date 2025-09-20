import { SES, SESClientConfig } from "@aws-sdk/client-ses";
import * as sesLibrary from "@aws-sdk/client-ses";

export class SESWrapper {
    private _clients = new Map<string, SES>();

    getsesLibrary() {
        return sesLibrary;
    }

    async connect(config: SESClientConfig, regions: string[]) {
        try {
            for (const region of regions) {
                const ses = new SES({ ...config, region });
                this._clients.set(region, ses);
            }
        } catch (error) {
            throw new Error(`Error while connecting to the SES regions. ${error}`);
        }
    }

    getClient(region: string) {
        if (!this._clients.has(region)) throw new Error(`Cannot access SES client for ${region} before connecting`);
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