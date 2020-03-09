import { DynamoDB, KMS } from "aws-sdk";
import { CreateUserBody, ApiResponse, UUID, ForbiddenError, BadRequestError } from "./models";
import { HTTP_403_MESSAGE } from "./const";

const uuid4 = require('uuid4');

export async function processCreateUserRequest(body: CreateUserBody): Promise<UUID> {
    const customKey = body.cmk;
    const kmsService = new KMS();
    const passwordEncryped = await kmsService.encrypt({
        KeyId: customKey,
        Plaintext: body.password
    }).promise()

    if (!passwordEncryped.CiphertextBlob) {
        throw new Error('Password could not be encrypted (CiphertextBlob missing)');
    }

    const id = uuid4() as UUID;

    const dynamodbClient = new DynamoDB({ apiVersion: '2012-08-10' });
    await dynamodbClient.putItem({
        TableName: process.env.USERS_TABLE as string,
        Item: {
            "id": { S: id },
            "firstName": { 'S': body.firstName },
            "lastName": { 'S': body.lastName },
            "username": { 'S': body.username },
            "email": { 'S': body.email },
            "password": { 'B': passwordEncryped.CiphertextBlob },
        }
    }).promise();

    return id;
}

/**
 * Find user in dyanmodb table, and only give user data once the request
 * has been auth'd using the CMK and creds
 * 
 * @param id the id of the user
 * @param cmk the user-defined CMK
 * @param creds the password for this user
 */
export const processGetUserRequest = async (
    id: string,
    cmk: string,
    creds: string
): Promise<ApiResponse> => {
    const dynamodbClient = new DynamoDB({ apiVersion: '2012-08-10' });
    let item;
    item = await dynamodbClient
        .getItem({
            TableName: process.env.USERS_TABLE as string,
            Key: { "id": { ['S']: id } }
        })
        .promise()
        .then(d => d.Item)

    if (!item) {
        throw new BadRequestError(`Cannot find user with id '${id}'`);
    }

    const passwordEncrypted = item?.password.B;
    const kmsService = new KMS();

    let password: string;
    try {
        const kmsResponse = await kmsService
            .decrypt({
                CiphertextBlob: passwordEncrypted as Uint8Array,
                KeyId: cmk
            })
            .promise();
        password = kmsResponse.Plaintext?.toString() as string;
    } catch (error) {
        /* Extend for other aws-sdk errors as necessary */
        if (error.code === "IncorrectKeyException") {
            throw new ForbiddenError();
        }
        throw error;
    }

    if (password !== creds) {
        throw new ForbiddenError();
    }

    return new ApiResponse(
        200,
        "User found",
        {
            id,
            username: item?.username.S as string,
            firstName: item?.firstName.S as string,
            lastName: item?.lastName.S as string,
            email: item?.email.S as string
        }
    );
}