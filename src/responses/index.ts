import { Response } from "express";

export const ResponseStatusCode = {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    AUTHENTICATION_FAILURE: 401,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

export const notFoundResponse = (res: Response, errors = [{ message: 'Not Found' }]) => {
    const url = res.req ? res.req.originalUrl : '';
    return res.status(ResponseStatusCode.NOT_FOUND).json({ statusCode: ResponseStatusCode.NOT_FOUND, errors, url });
};

export const authorizationFailureResponse = (res: Response, errors = [{ message: 'UnAuthorized' }]) => {
    return res.status(ResponseStatusCode.UNAUTHORIZED).json({ statusCode: ResponseStatusCode.UNAUTHORIZED, errors });
}

export const authenticationFailureResponse = (res: Response, errors = [{ message: 'Authentication Failed' }]) => {
    return res.status(ResponseStatusCode.AUTHENTICATION_FAILURE).json({ statusCode: ResponseStatusCode.AUTHENTICATION_FAILURE, errors });
}