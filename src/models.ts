import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { HTTP_403_MESSAGE } from './const';

/* Wrapper typing */
export type apiFunc = (event: APIGatewayEvent) => Promise<APIGatewayProxyResult>;

export type UUID = string;

/* Custom data types */
export interface User {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
}

export interface CreateUserBody {
    cmk: string;
    firstName: string,
    lastName: string,
    username: string,
    password: string,
    email: string,
}

/* Helper types */
export type SupportedStatusCode = 200 | 400 | 403 | 500;
export type ApiResponseBody = { message: string }
export class ApiResponse {
    statusCode: SupportedStatusCode;
    body: string;
    constructor(statusCode: SupportedStatusCode, message: string, data?: {}) {
        this.statusCode = statusCode;
        const payload = data ? { message, data } : { message };
        this.body = JSON.stringify(payload);
    }
}

export class BadRequestError extends Error {
    public static NAME = "BadRequestError";
    name = BadRequestError.NAME;
    constructor(message: string) {
        super(message);
    }
}

export class ForbiddenError extends Error {
    public static NAME = "ForbiddenError";
    name = ForbiddenError.NAME;
    constructor() {
        super(HTTP_403_MESSAGE);
    }
}