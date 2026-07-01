import { Request, Response } from 'express';
import Constants from '@constants/shared';
import JsonApiResponse from '@models/jsonapi';
import { renderHtml } from '@middleware/static-files';

export function handle404(request: Request, response: Response) {
    request.session.destroy((error) => {
        if (error) {
            console.error('Failed to destroy user session on 404:', error);
        }
        if (request.path.startsWith('/api')) {
            const jsonapiResponse = new JsonApiResponse();
            jsonapiResponse.addError({
                title: 'Not Found',
                detail: `The requested resource does not exist: ${request.url}`,
                status: Constants.ERROR_CODES.NOT_FOUND,
                code: Constants.HTTP_STATUS_CODES.NOT_FOUND.toString()
            });
            response.status(404).json(jsonapiResponse);
        } else {
            response.status(404).send(renderHtml('pages', '404'));
        }
    });
}

export function handleServerError(_: Request, response: Response) {
    const jsonapiResponse = new JsonApiResponse();
    jsonapiResponse.addError({
        title: 'Server Error',
        detail: Constants.ERROR_MESSAGES.UNEXPECTED,
        status: Constants.ERROR_CODES.INTERNAL_SERVER_ERROR,
        code: Constants.HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR.toString()
    });
    response.status(500).json(jsonapiResponse);
}
