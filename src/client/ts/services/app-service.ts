import HttpClient from '@client/utils/http-client';
import JsonApiPayload, { JsonApiException } from '@models/jsonapi';
import { LoginForm } from 'form-types';
import AppWindow from '@models/window';

declare const window: AppWindow;

export default class AppService extends HttpClient {
    constructor() {
        super(window.AppData.serverInfo.baseUrl + '/api');
    }

    public async applyCSRFToken(): Promise<void> {
        this.setHeader('X-CSRF-Token', await this.getCSRFToken());
    }

    public async getCSRFToken(): Promise<string> {
        if (!!window.AppData?.tokens?.csrfToken?.length) {
            return window.AppData.tokens.csrfToken;
        }
        const response = await this.get('/api/csrf');
        const payload = await AppService.handle(response);
        if (typeof payload.data !== 'string') {
            throw new Error('Unable to retrieve fresh csrf token.');
        }
        return payload.data;
    }

    /**
     * @description Attempt User login
     * @param {LoginForm} formData
     * @returns {Promise<JsonApiPayload>}
     */
    public async login(formData: LoginForm): Promise<JsonApiPayload> {
        const response = await this.post('/api/login', {
            username: formData.username,
            password: formData.password
        });
        return AppService.handle(response);
    }

    /**
     * @description Check if the response is ok. If it is, return the body as a JsonApiPayload. If not, throw a JsonApiException
     * @param response The response to process
     * @returns {Promise<JsonApiPayload>}
     */
    public static async handle(response: Response): Promise<JsonApiPayload> {
        try {
            if (response.ok) {
                return JsonApiPayload.from(await response.json());
            }
            const contentType = response.headers.get('content-type');
            if (contentType?.includes('application/json')) {
                const payload = JsonApiPayload.from(await response.json());
                throw new JsonApiException(payload);
            }
            throw new JsonApiException({
                message: `Callout failed with status: ${response.statusText} (${response.status})`,
                errors: [
                    {
                        title: response.statusText,
                        status: response.statusText,
                        code: response.status.toString(),
                        detail: await response.text()
                    }
                ]
            });
        } catch (error) {
            console.error(error);
            if (error instanceof JsonApiException) {
                throw error;
            }
            if (!(error instanceof Error)) {
                throw new JsonApiException({
                    message: 'An unknown error occurred'
                });
            }
            throw new JsonApiException({
                message: error.message
            });
        }
    }
}
