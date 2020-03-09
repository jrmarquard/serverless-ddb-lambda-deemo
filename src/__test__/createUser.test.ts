import { APIGatewayEvent } from 'aws-lambda';
import * as AWSMock from "aws-sdk-mock";
import * as AWS from "aws-sdk";
import { GetItemInput } from "aws-sdk/clients/dynamodb";

import { expect } from 'chai';
import { getUser } from "..";

before(async () => {
    process.env.STAGE = "dev";
    process.env.USERS_TABLE = `dynamoAndLambdaDemo-${process.env.STAGE}-users`;
});

describe("Get Users", () => {
    it("should 400 on missing id", async () => {
        expect(await getUser({
            headers: {
                'user-cmk': '',
                'user-cred': '',
            },
            pathParameters: {
                id: 'abcd'
            },
        } as unknown as APIGatewayEvent)).to.deep.equal({
            statusCode: 400,
            body: JSON.stringify({ message: "ID is not valid" })
        });
    });

    /**
     * Skipping until I can resolve known issues with loading AWS services. Might need plain sinon
     * 
     * From: https://www.npmjs.com/package/aws-sdk-mock
     * "NB: The AWS Service needs to be initialised inside the function being tested in order for the SDK method to be mocked.
     */
    it.skip("should mock getItem from DynamoDB", async () => {
        // Overwriting DynamoDB.getItem()
        AWSMock.setSDKInstance(AWS);
        AWSMock.mock(
            'KMS',
            'encrypt',
            (params: GetItemInput, callback: Function) => {
                console.log('KMS.encrypt() was called')
                callback(null, { pk: "foo", sk: "bar" });
            }
        );
        AWSMock.mock(
            'DynamoDB',
            'getItem',
            (params: GetItemInput, callback: Function) => {
                console.log('DynamoDB', 'getItem', 'mock called!!');
                callback(null, { pk: "foo", sk: "bar" });
            }
        );

        expect(await getUser({
            headers: {
                'user-cmk': 'asdf',
                'user-creds': 'asdf',
            },
            pathParameters: {
                id: '063cbea4-c377-4923-aef8-01dfd5c31a3d'
            },
        } as unknown as APIGatewayEvent)).to.deep.equal({
            statusCode: 400,
            message: 'not sure'
        });

        AWSMock.restore('DynamoDB');
    });
});
