import { apiFunc, ApiResponse, BadRequestError, ForbiddenError } from './models';
import { validateCreateUserBody, validateGetUserRequest } from './validation';
import { processCreateUserRequest, processGetUserRequest } from './operations';

export const createUser: apiFunc = async (event) => {
    try {
        const data = validateCreateUserBody(event.body);

        const id = await processCreateUserRequest(data);

        return new ApiResponse(200, "User Created", { id });
    } catch (error) {
        if (error.name === BadRequestError.NAME) {
            return new ApiResponse(400, error.message);
        }
        /* TODO: direct these to Engineering team and don't log */
        console.log(error);
        return new ApiResponse(500, "Server Error");
    }
}

export const getUser: apiFunc = async (event) => {
    try {
        const { id, userCmk, userCreds } = validateGetUserRequest(event);

        return await processGetUserRequest(
            id,
            userCmk,
            userCreds
        );
    } catch (error) {
        if (error.name === BadRequestError.NAME) {
            return new ApiResponse(400, error.message);
        } else if (error.name === ForbiddenError.NAME) {
            return new ApiResponse(403, error.message);
        }
        /* TODO: direct these to Engineering team and don't log */
        console.log(error);
        return new ApiResponse(500, "Server Error");
    }
}