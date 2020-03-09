import { DynamoDB, KMS } from "aws-sdk";
import { CreateUserBody, ApiResponse, UUID, ForbiddenError } from "./models";
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

export const processGetUserRequest = async (
    id: string,
    cmk: string,
    creds: string
): Promise<ApiResponse> => {
    const dynamodbClient = new DynamoDB({ apiVersion: '2012-08-10' });
    const item = await dynamodbClient
        .getItem({
            TableName: process.env.USERS_TABLE as string,
            Key: { "id": { ['S']: id } }
        })
        .promise()
        .then(d => d.Item)

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