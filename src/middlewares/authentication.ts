import { NextFunction, Request, Response } from 'express';
import { verify, VerifyOptions } from 'jsonwebtoken';
import { AccessTokenError, AuthFailureError } from '../errors';
import { JwtPayload } from '../helpers/jwt';

declare global {
    namespace Express {
        interface Request {
            payload?: JwtPayload;
        }
    }
}

/**
 * Middleware to authenticate and validate JWT access tokens.
 * @param publicKey - The RSA/EC public key used to verify the token.
 * @param validations - Optional JWT verification options like audience, issuer, etc.
 */
export const authentication = (
    publicKey: string,
    validations?: VerifyOptions
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new AuthFailureError('Authorization header missing or malformed');
            }

            const token = authHeader.split(' ')[1];
            const payload = verify(
                token,
                publicKey,
                validations
            ) as JwtPayload;

            if (!payload || !payload.iss || !payload.aud) {
                throw new AccessTokenError('Invalid access token structure');
            }

            // Attach payload to response locals
            req.payload = payload;
            return next();
        } catch (err) {
            next(err);
        }
    };
};
