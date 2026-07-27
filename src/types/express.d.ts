import { IAppData } from '@models/window';

declare module 'express-session' {
    export interface SessionData {
        userId?: string;
    }
}

declare module 'express' {
    export interface Request {
        page?: string;
    }
    export interface Response {
        appData?: IAppData;
        cspNonce?: string;
    }
}

export {};
