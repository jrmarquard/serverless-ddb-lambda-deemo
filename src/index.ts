import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from "aws-sdk";

const uuid4 = require('uuid4');

type apiFunc = (event: APIGatewayEvent) => Promise<APIGatewayProxyResult>;

export type SupportedStatusCode = 200 | 400 | 500;
export type ApiResponseBody = { message: string }
export class ApiResponse {
    statusCode: SupportedStatusCode = 500;
    body: string;
    constructor(statusCode: SupportedStatusCode, message: string, data?: {}) {
        this.statusCode = statusCode;
        const payload = data ? { message, data } : { message };
        this.body = JSON.stringify(payload);
    }
}


interface CreateUserBody {
    firstName: string,
    lastName: string,
    username: string,
    password: string,
    email: string,
}

function validateCreateUserBody(obj: string | null): CreateUserBody {
    if (!obj) {
        throw new Error("Missing body");
    }

    let body: CreateUserBody;
    try {
        body = JSON.parse(obj) as CreateUserBody;
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

    if (errors.length > 0) {
        throw new Error(errors.join(", "));
    }

    // TODO: other 4xx validation checks. e.g. email
    return body;
}

export async function processCreateUserRequest(id: string, body: CreateUserBody) {
    const dynamodbClient = new DynamoDB({ apiVersion: '2012-08-10' });
    return await dynamodbClient.putItem({
        TableName: process.env.USERS_TABLE as string,
        Item: {
            "id": { S: id },
            "firstName": { 'S': body.firstName },
            "lastName": { 'S': body.lastName },
            "username": { 'S': body.username },
            "email": { 'S': body.email },
        }
    }).promise();
}

export const createUser: apiFunc = async (event) => {
    let body: CreateUserBody;
    try {
        body = validateCreateUserBody(event.body);
    } catch (error) {
        return new ApiResponse(400, error.message);
    }

    try {
        const id = uuid4();
        const response = await processCreateUserRequest(id, body);
        console.log(JSON.stringify(response.Attributes));

        return new ApiResponse(200, "User Created", { id });
    } catch (error) {
        // TODO: don't log, notify
        console.log(`dynamodbClient.putItem error: ${error}`);
        /* Suitable checks on body should be done before trying to put
         * item into users table. Assume 500. */
        return new ApiResponse(500, "Server Error");
    }
}

export const listUsers: apiFunc = async (event) => {
    console.log(JSON.stringify(event.pathParameters, null, 4));
    console.log(JSON.stringify(event.body, null, 4));

    const responseBody = {
        data: [
            {
                username: 'test'
            }
        ]
    }

    return {
        statusCode: 200,
        body: JSON.stringify(responseBody)
    };
}