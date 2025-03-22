import { Response } from "express";

export const ResponseStatusCode = {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    MULTI_STATUS: 207,
    BAD_REQUEST: 400,
    AUTHENTICATION_FAILURE: 401,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};

export const authenticationFailureResponse = (res: Response, errors = [{ message: 'Authentication Failed' }]) => {
    return res.status(ResponseStatusCode.AUTHENTICATION_FAILURE).json({ errors });
}

export const notFoundResponse = (res: Response, errors = [{ message: 'Not Found' }]) => {
    const url = res.req ? res.req.originalUrl : '';
    return res.status(ResponseStatusCode.NOT_FOUND).json({ errors, url });
};

export const forbiddenResponse = (res: Response, errors = [{ message: 'Forbidden' }]) => {
    return res.status(ResponseStatusCode.FORBIDDEN).json({ errors });
}

export const badrequestResponse = (res: Response, errors = [{ message: 'Bad Request' }]) => {
    return res.status(ResponseStatusCode.BAD_REQUEST).json({ errors });
}

export const internalServerErrorResponse = (res: Response, errors = [{ message: 'Internal Server Error' }]) => {
    return res.status(ResponseStatusCode.INTERNAL_SERVER_ERROR).json({ errors });
}

export const authorizationFailureResponse = (res: Response, errors = [{ message: 'Unauthorized' }]) => {
    return res.status(ResponseStatusCode.UNAUTHORIZED).json({ errors });
}

export const successMsgResponse = (res: Response, message = 'Success') => {
    return res.status(ResponseStatusCode.SUCCESS).json({ message });
}

export const failureMsgResponse = (res: Response, errors = [{ message: 'Failed' }]) => {
    return res.status(ResponseStatusCode.INTERNAL_SERVER_ERROR).json({ errors });
}

export const successResponse = (res: Response, message = 'Success', data: any) => {
    return res.status(ResponseStatusCode.SUCCESS).json({ message, data });
}

export const paginatedResponse = (res: Response, message = 'Success', data: any, pagination: object) => {
    return res.status(ResponseStatusCode.SUCCESS).json({ message, data, pagination });
}

export const customResponse = (res: Response, message = 'Success', data: any) => {
    return res.status(ResponseStatusCode.SUCCESS).json({ message, ...data });
}

export const newCreatedResponse = (res: Response, message = 'Successfully Created', data: any) => {
    return res.status(ResponseStatusCode.CREATED).json({ message, data });
}

export const accessTokenErrorResponse = (res: Response, errors = [{ message: 'Invalid Access Token' }]) => {
    res.setHeader('instruction', 'refresh_token');
    return res.status(ResponseStatusCode.UNAUTHORIZED).json({ errors });
}

export const noContentFoundErrorResponse = (res: Response, errors = [{ message: 'No Content Found' }]) => {
    return res.status(ResponseStatusCode.NO_CONTENT).json({ errors });
}

export const multiStatusResponse = (res: Response, data: any) => {
    return res.status(ResponseStatusCode.MULTI_STATUS).json({ data });
}