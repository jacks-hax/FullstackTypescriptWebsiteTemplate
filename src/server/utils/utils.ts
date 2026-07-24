import { RequestError, DatabaseError } from '@database/models/errors';
import { FieldDescribe } from '@database/describe';
import JsonApiResponse from '@models/jsonapi';
import Constants from '@constants/shared';
import StringUtils from '@utils/string';
import { Response } from 'express';
import { ISiteIndex } from '@models/window';

export default class Utils {
    private static siteIndex: ISiteIndex = {};
    /**
     * @description Get the base url to access the gateway to this server
     * @returns {string} Server base url
     */
    public static getServerBaseUrl(): string {
        let baseUrl = process.env.SERVER_PROTOCOL + '://' + process.env.SERVER_HOST_NAME;
        console.log('constructing server url for ', process.env.NODE_ENV);
        if (process.env.NODE_ENV === 'development') {
            baseUrl += ':' + process.env.SERVER_PORT;
        }
        baseUrl += process.env.GATEWAY_PATH;
        return new URL(baseUrl).href.replace(/\/+$/, '');
    }

    public static getSiteIndex(): ISiteIndex {
        if (!!Object.keys(Utils.siteIndex)) {
            return Utils.siteIndex;
        }

        return Utils.siteIndex;
    }

    /**
     * @description Ensure that a request payload is valid
     * @param payload Payload from request
     * @param allowedFields Field describes that are allowed for this request
     * @throws {RequestError} If any extra unexpected fields are present, or if any required fields are missing
     */
    public static validateFields(payload: Record<string, any>, allowedFields: Array<FieldDescribe>): void {
        const allowedFieldSet: Set<string> = new Set(allowedFields.map((field) => field.name));

        // Throw an error if there are any extra fields that are not expected
        const unexpectedFields: Array<string> = [];
        for (const providedField of Object.keys(payload)) {
            if (payload[providedField] !== undefined && !allowedFieldSet.has(providedField)) {
                unexpectedFields.push(providedField);
            }
        }
        if (unexpectedFields.length) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.INVALID_FIELDS, [
                unexpectedFields.length > 1 ? 's' : '',
                unexpectedFields.join(', ')
            ]);
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, errorMessage);
        }

        // Throw an error if any required fields are missing
        const missingRequiredFields: Array<string> = [];
        for (const requiredField of allowedFields.filter((field) => !field.nillable)) {
            if (payload[requiredField.name] == null) {
                missingRequiredFields.push(requiredField.name);
            }
        }
        if (missingRequiredFields.length) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.REQUIRED_FIELDS_MISSING, [
                missingRequiredFields.length > 1 ? 's' : '',
                missingRequiredFields.join(', ')
            ]);
            throw new RequestError(Constants.ERROR_CODES.BAD_REQUEST, errorMessage);
        }
    }

    public static applyErrorToResponse(error: any, response: Response): void {
        let errorMessage: string = error instanceof Error ? error.message : Constants.ERROR_MESSAGES.UNEXPECTED;
        let httpStatusCode: number = Constants.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
        let errorCode: string = Constants.ERROR_CODES.INTERNAL_SERVER_ERROR;
        if (error instanceof DatabaseError) {
            errorCode = error.code;
            switch (error.code) {
                case Constants.MYSQL_ERROR_CODES.ER_DUP_ENTRY:
                    httpStatusCode = Constants.HTTP_STATUS_CODES.CONFLICT;
                    break;
            }
        } else if (error instanceof RequestError) {
            errorCode = error.errorCode;
            httpStatusCode = error.statusCode ?? Constants.HTTP_STATUS_CODES.BAD_REQUEST;
        }
        const jsonapiPayload = new JsonApiResponse();
        jsonapiPayload.addError({
            title: 'Error',
            detail: errorMessage,
            status: errorCode,
            code: httpStatusCode.toString()
        });
        response.status(httpStatusCode).json(jsonapiPayload);
    }

    public static getContentType(filename: string) {
        const parts = filename.split('.');
        const extension = parts[parts.length - 1].toUpperCase() as keyof typeof Constants.CONTENT_TYPES;
        if (!!Constants.CONTENT_TYPES[extension]) {
            return Constants.CONTENT_TYPES[extension];
        }
        return Constants.CONTENT_TYPES.OCTET_STREAM;
    }
}
