import { Response } from 'express'
import { authenticationFailureResponse, authorizationFailureResponse, notFoundResponse } from '../responses/index.js';

enum ErrorType {
    BAD_TOKEN = 'BadTokenError',
    TOKEN_EXPIRED = 'TokenExpiredError',
    AUTHENTICATION_FAILURE = 'AuthenticationFailureError',
    UNAUTHORIZED = 'AuthFailureError',
    ACCESS_TOKEN = 'AccessTokenError',
    INTERNAL = 'InternalError',
    NOT_FOUND = 'NotFoundError',
    NO_ENTRY = 'NoEntryError',
    NO_DATA = 'NoDataError',
    BAD_REQUEST = 'BadRequestError',
    FORBIDDEN = 'ForbiddenError',
    REQUEST_VALIDATION = 'RequestValidationError'
}

export class GenericError extends Error {
    constructor(public type: ErrorType, public message: string) {
        super(message);
        this.name = 'API Error';
        this.type = type;
    }

    static handle(err: any, res: Response) {
        switch (err.type) {
            case ErrorType.NOT_FOUND:
                return notFoundResponse(res, err.serializeErrors());
            case ErrorType.UNAUTHORIZED:
                return authorizationFailureResponse(res, err.serializeErrors());
            case ErrorType.AUTHENTICATION_FAILURE:
                return authenticationFailureResponse(res, err.serializeErrors());
        }
    }
}

export class NotFoundError extends GenericError {
    constructor(message: string = 'Not Found') {
        super(ErrorType.NOT_FOUND, message);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

export class AuthenticationFailure extends GenericError {
    constructor(message: string = 'Authentication Failed') {
        super(ErrorType.AUTHENTICATION_FAILURE, message);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

export class AuthorizationFailure extends GenericError {
    constructor(message: string = 'UnAuthorized') {
        super(ErrorType.UNAUTHORIZED, message);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}