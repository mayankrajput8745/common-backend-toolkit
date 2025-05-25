import { Response } from 'express';
import {
    authenticationFailureResponse,
    accessTokenErrorResponse,
    internalServerErrorResponse,
    notFoundResponse,
    badRequestResponse,
    forbiddenResponse,
    failureMsgResponse
} from '../responses';

enum ErrorType {
    BAD_TOKEN = 'BadTokenError',
    TOKEN_EXPIRED = 'TokenExpiredError',
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
        this.name = 'GENERIC_ERROR';
        this.type = type;
    }

    static handle(err: any, res: Response) {
        switch (err.type) {
            case ErrorType.BAD_TOKEN:
            case ErrorType.TOKEN_EXPIRED:
            case ErrorType.UNAUTHORIZED:
                return authenticationFailureResponse(res, err.serializeErrors());
            case ErrorType.ACCESS_TOKEN:
                return accessTokenErrorResponse(res, err.serializeErrors());
            case ErrorType.INTERNAL:
                return internalServerErrorResponse(res, err.serializeErrors());
            case ErrorType.NOT_FOUND:
            case ErrorType.NO_ENTRY:
            case ErrorType.NO_DATA:
                return notFoundResponse(res, err.serializeErrors());
            case ErrorType.BAD_REQUEST:
                return badRequestResponse(res, err.serializeErrors());
            case ErrorType.FORBIDDEN:
                return forbiddenResponse(res, err.serializeErrors());
            case ErrorType.REQUEST_VALIDATION:
                return forbiddenResponse(res, err.serializeErrors());
            default: {
                let errors = err.serializeErrors();
                // Do not send failure message in production as it may send sensitive data
                // if (process.env.NODE_ENV === 'production') errors = [{ message: 'Something wrong happened.' }];
                return failureMsgResponse(res, errors);
            }
        }
    }
}

export class AuthFailureError extends GenericError {
    constructor(message = 'Invalid Credentials') {
        super(ErrorType.UNAUTHORIZED, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class InternalError extends GenericError {
    constructor(message = 'Internal error') {
        super(ErrorType.INTERNAL, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class BadRequestError extends GenericError {
    constructor(message = 'Bad Request') {
        super(ErrorType.BAD_REQUEST, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class NotFoundError extends GenericError {
    constructor(message = 'Not Found') {
        super(ErrorType.NOT_FOUND, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class ForbiddenError extends GenericError {
    constructor(message = 'Permission denied') {
        super(ErrorType.FORBIDDEN, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class NoEntryError extends GenericError {
    constructor(message = "Entry don't exists") {
        super(ErrorType.NO_ENTRY, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class BadTokenError extends GenericError {
    constructor(message = 'Token is not valid') {
        super(ErrorType.BAD_TOKEN, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class TokenExpiredError extends GenericError {
    constructor(message = 'Token is expired') {
        super(ErrorType.TOKEN_EXPIRED, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class NoDataError extends GenericError {
    constructor(message = 'No data available') {
        super(ErrorType.NO_DATA, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class AccessTokenError extends GenericError {
    constructor(message = 'Invalid access token') {
        super(ErrorType.ACCESS_TOKEN, message);
    }
    serializeErrors() { return [{ message: this.message }]; }
}

export class RequestValidationError extends GenericError {
    constructor(public errors: any) {
        super(ErrorType.REQUEST_VALIDATION, errors);
    }
    serializeErrors() {
        return this.errors.map((err: any) => {
            return { message: err.msg, field: err.param };
        });
    }
}
