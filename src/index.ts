import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';

type apiFunc = (event: APIGatewayEvent) => Promise<APIGatewayProxyResult>;

export const createUsers: apiFunc = async (event) => {
    console.log(JSON.stringify(event.body, null, 4));

    const responseBody = {
        success: true,
        message: 'hello'
    }

    return {
        statusCode: 200,
        body: JSON.stringify(responseBody)
    };
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