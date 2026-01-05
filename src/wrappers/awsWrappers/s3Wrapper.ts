import { S3, S3ClientConfig, waitUntilBucketExists } from '@aws-sdk/client-s3';
import * as s3Library from '@aws-sdk/client-s3';

type Buckets = string[] | { [key: string]: string };

export class S3Wrapper {
    private _clients = new Map<string, S3>();

    gets3Library() {
        return s3Library;
    }

    async connect(config: S3ClientConfig, buckets: Buckets, maxWaitTime: number = 1000) {
        try {
            const bucketList = Array.isArray(buckets) ? buckets : Object.values(buckets);
            
            for (const bucket of bucketList) {
                const s3 = new S3(config);
                await waitUntilBucketExists({ client: s3, maxWaitTime }, { Bucket: bucket });
                this._clients.set(bucket, s3);
            }
        } catch (error) {
            throw new Error(`Error while connecting to the S3 buckets. ${error}`);
        }
    }

    getClient(bucketName: string) {
        if (!this._clients.has(bucketName)) throw new Error(`Cannot access s3 client for ${bucketName} before connecting`);
        return this._clients.get(bucketName);
    }

    async disconnect(buckets: Buckets) {
        try {
            const bucketList = Array.isArray(buckets) ? buckets : Object.values(buckets);
            
            for (const bucket of bucketList) {
                if (this._clients.has(bucket)) {
                    const client = this._clients.get(bucket);
                    if (client) {
                        client.destroy();
                        this._clients.delete(bucket);
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }

    async destroy(buckets: Buckets) {
        await this.disconnect(buckets);
    }

};