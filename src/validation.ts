import { APIGatewayEvent } from 'aws-lambda';
import { CreateUserBody as CreateUserData, BadRequestError } from "./models";
import { HTTP_HEADER_USER_CMK, HTTP_HEADER_USER_CREDS } from './const';

const uuid4 = require('uuid4');

/* Return typed parameters for create user request, throw error if any invalid. */
export function validateCreateUserBody(obj: string | null): CreateUserData {
    if (!obj) {
        throw new Error("Missing body");
    }

    let body: CreateUserData;
    try {
        body = JSON.parse(obj) as CreateUserData;
    } catch {
        throw new Error("JSON is not valid");
    }

    const errors: Array<string> = [];
    if (!body.email || typeof body.email !== "string") {
        errors.push(`Email is missing or not a string`);
    }
    if (!body.firstName || typeof body.firstName !== "string") {
        errors.push(`First name is missing`);
    }
    if (!body.lastName || typeof body.lastName !== "string") {
        errors.push(`Last name is missing`);
    }
    if (!body.password || typeof body.password !== "string") {
        errors.push(`Password is missing`);
    }
    if (!body.username || typeof body.username !== "string") {
        errors.push(`Username is missing`);
    }
    if (!body.cmk || typeof body.cmk !== "string") {
        errors.push(`Custom Master Key is missing`);
    }

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }

    // TODO: other 4xx validation checks. e.g. email
    return body;
}


/* Return typed parameters for get user request, throw error if any invalid. */
export const validateGetUserRequest = (event: APIGatewayEvent) => {
    if (!event.pathParameters || !event.pathParameters.id) {
        throw new BadRequestError("Missing user id from path");
    }

    const id = event.pathParameters.id as string;
    if (!uuid4.valid(id)) {
        throw new BadRequestError("ID is not valid");
    }
    if (!event.headers[HTTP_HEADER_USER_CMK]) {
        throw new BadRequestError(`Missing ${HTTP_HEADER_USER_CMK} from headers`);
    }
    if (!event.headers[HTTP_HEADER_USER_CREDS]) {
        throw new BadRequestError(`Missing ${HTTP_HEADER_USER_CREDS} from headers`);
    }

    const userCmk = event.headers[HTTP_HEADER_USER_CMK];
    const userCreds = event.headers[HTTP_HEADER_USER_CREDS];

    return { id, userCmk, userCreds }
}