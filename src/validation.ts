import { APIGatewayEvent } from 'aws-lambda';
import { CreateUserBody as CreateUserData, BadRequestError } from "./models";
import { HTTP_HEADER_USER_CMK, HTTP_HEADER_USER_CREDS } from './const';

const uuid4 = require('uuid4');

interface CreateUserFieldValidationMap { [field: string]: (value: any) => undefined | string }

const isDefinedString = (field: string, v: any) => {
    if (!v || typeof v !== "string") {
        return `${field} is missing or not a string`;
    } else {
        return undefined;
    }
}
const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

const createUserFieldValidationMap: CreateUserFieldValidationMap = {
    email: (v: any) => {
        if (!v || typeof v !== "string") {
            return "Email is missing or not a string";
        } else if (!v.match(new RegExp(emailRegex))) {
            return "Email is not valid";
        } else {
            return undefined;
        }
    },
    firstName: (v) => isDefinedString("firstName", v),
    lastName: (v) => isDefinedString("lastName", v),
    password: (v) => isDefinedString("password", v),
    username: (v) => isDefinedString("username", v),
    cmk: (v) => isDefinedString("cmk", v),
}

/* Return typed parameters for create user request, throw error if any invalid. */
export function validateCreateUserBody(obj: string | null): CreateUserData {
    if (!obj) {
        throw new BadRequestError("Missing body");
    }

    let body: { [x: string]: any };
    try {
        body = JSON.parse(obj);
    } catch {
        throw new BadRequestError("JSON is not valid");
    }

    // const errors: Array<string> = [];
    const errors = Object.entries(createUserFieldValidationMap)
        .map(([field, fn]) => fn(body[field]))
        .filter(validationError => (validationError !== undefined)) as Array<string>

    if (errors.length > 0) {
        throw new BadRequestError(errors.join(", "));
    }

    return body as CreateUserData;
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