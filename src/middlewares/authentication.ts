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
            const accessToken = req.headers['x-access-token'];
            const refreshToken = req.headers['x-refresh-token'];

            if (!accessToken) throw new AuthFailureError('Access token not provided');
            if (!refreshToken) throw new AuthFailureError('Refresh token not provided');

            const payload = verify(
                accessToken.toString(),
                publicKey,
                validations
            ) as JwtPayload;

            if (!payload || !payload.iss || !payload.aud) {
                throw new AccessTokenError('Invalid access token structure');
            }

            // Attach payload to response locals
            res.locals.payload = payload;
            return next();
        } catch (err) {
            next(err);
        }
    };
};
