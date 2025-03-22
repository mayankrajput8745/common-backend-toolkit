import { S3, S3ClientConfig, waitUntilBucketExists } from '@aws-sdk/client-s3';
import * as s3Library from '@aws-sdk/client-s3';

interface Buckets {
    [key: string]: string
}

export class S3Wrapper {
    private _clients = new Map<string, S3>();

    gets3Library() {
        return s3Library;
    }

    async connect(config: S3ClientConfig, buckets: Buckets, maxWaitTime: number = 1000) {
        try {
            for (const [bucketName, bucket] of Object.entries(buckets)) {
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

    async destroy(buckets: Buckets) {
        try {
            for (const [bucketName, bucket] of Object.entries(buckets)) {
                if (this._clients.has(bucketName)) {
                    const client = this._clients.get(bucketName);
                    if (client) {
                        client.destroy();
                        this._clients.delete(bucketName);
                    }
                }
            }
        } catch (error) {
            throw error;
        }
    }

};