import { verify, sign, decode, SignOptions } from "jsonwebtoken";

export class JWT {

    async encode(payload: JwtPayload, privateKey: string, options: SignOptions = {}): Promise<string> {
        if (!privateKey) throw new Error("Private key is required");

        return new Promise((resolve, reject) => {
            sign({ ...payload }, privateKey, options, (err, token) => {
                if (err || !token) return reject(err);
                resolve(token);
            });
        });
    }

    async decode(token: string): Promise<JwtPayload | null> {
        return decode(token, { json: true }) as JwtPayload | null;
    }
    async verify(token: string, publicKey: string, validation: ValidationsParams): Promise<JwtPayload> {
        if (!publicKey) throw new Error("Public key is required");

        return new Promise((resolve, reject) => {
            verify(
                token,
                publicKey,
                validation,
                (err, decoded) => {
                    if (err) return reject(err);
                    resolve(decoded as JwtPayload);
                }
            );
        });
    }
}

export class ValidationsParams {
    issuer: string;
    audience: string;
    userId: string;
    data: any;

    constructor(issuer: string, audience: string, userId: string) {
        this.issuer = issuer;
        this.audience = audience;
        this.userId = userId;
    }
}

type Payload = {
    iss: string;
    aud: string;
    userId: string;
    data: any;
    tokenId: string;
}

export class JwtPayload {
    iss: string;
    aud: string;
    userId: string;
    data: any;
    tokenId: string;

    constructor({ iss, aud, userId, data, tokenId }: Payload) {
        this.iss = iss;
        this.aud = aud;
        this.userId = userId;
        this.data = data;
        this.tokenId = tokenId;
    }
}
