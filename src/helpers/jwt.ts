import { promisify } from "util";
import { verify, sign, decode, SignOptions } from "jsonwebtoken";


export class JWT {

    async encode(payload: JwtPayload, privateKey: string, options: SignOptions): Promise<string> {
        if (!privateKey) throw new Error("Private key is required");

        // @ts-ignore
        return promisify(sign)({ ...payload }, privateKey, options);
    }

    async decode(token: string, publicKey: string, validation: ValidationsParams): Promise<JwtPayload> {
        try {
            if (!publicKey) throw new Error("Public key is required");

            // @ts-ignore
            return <JwtPayload>promisify(decode)(token, publicKey, validation);
        } catch (error: any) {

            if (error && error.name === 'TokenExpiredError') {

                // @ts-ignore
                return <JwtPayload>promisify(decode)(token, publicKey, validation);
            } else {
                throw error;
            }
        }
    }

    async verify(token: string, publicKey: string, validation: ValidationsParams): Promise<JwtPayload> {
        try {
            if (!publicKey) throw new Error("Public key is required");

            // @ts-ignore
            return <JwtPayload>promisify(verify)(token, publicKey, validation);
        } catch (error: any) {
            if (error && error.name === 'TokenExpiredError') {

                // @ts-ignore
                throw error;
            } else {
                throw error;
            }
        }
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
    iat: number;
    exp: number;
    validity: number;
    data: any;
    tokenId: string;
}

const HOUR_IN_DAY = 24;
const MINUTES_IN_HOUR = 60;
const SECONDS_IN_MINUTE = 60;

export class JwtPayload {
    iss: string;
    aud: string;
    userId: string;
    iat: number;
    exp: number;
    data: any;
    tokenId: string;

    constructor({ iss, aud, userId, validity, data, tokenId }: Payload) {
        this.iss = iss;
        this.aud = aud;
        this.userId = userId;
        this.iat = Math.floor(Date.now() / 1000);
        this.exp = this.iat + (validity / HOUR_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE);
        this.data = data;
        this.tokenId = tokenId;
    }
}
