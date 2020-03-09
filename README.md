# serverless-ddb-lambda-deemo

Demo of Serverless application using AWS DynamoDB and Lambda

## Brief / Requirements

1. Create a [Serverless application](https://serverless.com/framework/docs/providers/aws/events/apigateway#configuring-endpoint-types)
1. Create a DynamoDB table in your AWS account to house "User" data. Attributes:
    1. id: String UUID
    1. firstName: String
    1. lastName: String
    1. username: String
    1. credentials: String (Encrypted)
    1. email: String
1. Create Lambdas to create and list items from this DynamoDB table.
    1. Keep credentials attribute as a write-only attribute.
    1. Upon save take plain password and encrypt it using KMS with a user-defined CMK.
1. Make the Lambda function available via an AWS API Gateway endpoint.
1. Write unit tests for your code by mocking AWS EC2 API.
1. Produce a code coverage report for your test suite.
1. Make response [JSON:API 1.0](https://jsonapi.org/format/1.0/) compatible.

## Requirements

- nodejs latest LTS ([installation instructions](https://nodejs.org/en/download/))
- aws cli ([installation instructions](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html))

## Initial setup

- Run `aws configure` if your box is not configured with AWS yet
- Run `npm i`

## Deployment 

Run `npm run deploy -- --stage { dev | prod }` to deploy to either dev or prod. `--stage` is required.

## Notes

#### Assumptions and liberties taken with instructions

- "credentials" is a simple plain text password
- "user-defined CMK" is a fully qualified ARN that the lambda handling the KMS encrypt has permission to use
