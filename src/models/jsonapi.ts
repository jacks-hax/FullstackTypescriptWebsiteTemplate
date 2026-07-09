import Constants from '@constants/shared';

export type JsonApiMetadata = Record<string, any>;
export type JsonApiInfo = {
    version: string;
    ext?: Array<string>;
    profile?: Array<string>;
    meta?: JsonApiMetadata;
};
export type JsonApiLink = {
    href: string;
    rel?: string;
    title?: string;
    describedby?: string;
    hreflang?: string;
    meta?: JsonApiMetadata;
};
export type JsonApiLinks = {
    self?: JsonApiLink | string;
    related?: JsonApiLink | string;
    first?: JsonApiLink | string;
    last?: JsonApiLink | string;
    prev?: JsonApiLink | string;
    next?: JsonApiLink | string;
    [key: string]: JsonApiLink | string | undefined;
};
export type JsonApiDataObject = Record<string, any> & {
    id?: string;
    type?: string;
    attributes?: Record<string, any>;
    relationships?: Record<string, any>;
    meta?: JsonApiMetadata;
};
export type JsonApiData = Array<JsonApiDataObject> | JsonApiDataObject;
export type JsonApiError = {
    id?: string;
    status: string;
    code: string;
    title: string;
    detail: string;
    fields?: Array<String>;
    source?: Record<string, any>;
    meta?: JsonApiMetadata;
};
export interface IJsonApiPayload {
    code?: string;
    message?: string;
    data?: JsonApiData;
    errors?: Array<JsonApiError>;
    meta?: JsonApiMetadata;
    jsonapi?: JsonApiInfo;
}

export default class JsonApiPayload implements IJsonApiPayload {
    code?: string;
    message?: string;
    data?: JsonApiData;
    errors?: Array<JsonApiError>;
    meta?: JsonApiMetadata;
    jsonapi?: JsonApiInfo;

    constructor(data?: JsonApiDataObject) {
        this.jsonapi = {
            version: Constants.JsonApi_VERSION
        };
        if (data) {
            this.setData(data);
        }
    }

    static from(payload: Record<string, any>): JsonApiPayload {
        const response = new JsonApiPayload();
        if (payload.code) {
            response.code = payload.code;
        }
        if (payload.message) {
            response.message = payload.message;
        }
        if (payload.data) {
            response.data = payload.data;
        }
        if (payload.errors) {
            response.errors = payload.errors;
        }
        if (payload.meta) {
            response.meta = payload.meta;
        }
        if (payload.jsonapi) {
            response.jsonapi = payload.jsonapi;
        }
        return response;
    }

    setData(data: JsonApiData): void {
        this.data = data;
    }

    addData(data: JsonApiDataObject): void {
        if (!this.data) {
            this.data = [data];
        } else if (Array.isArray(this.data)) {
            this.data.push(data);
        } else {
            this.data = [this.data, data];
        }
    }

    addError(error: JsonApiError): void {
        if (!this.errors) {
            this.errors = [error];
        } else {
            this.errors.push(error);
        }
    }
}

export class JsonApiException extends Error {
    public payload: JsonApiPayload;
    constructor(payload: JsonApiPayload | IJsonApiPayload) {
        super(
            payload.errors?.map((error) => error.detail).join(', ') || payload.message || 'An unknown error occurred'
        );
        Object.setPrototypeOf(this, JsonApiException.prototype);
        if (payload instanceof JsonApiPayload) {
            this.payload = payload;
        } else {
            this.payload = JsonApiPayload.from(payload);
        }
    }
}
