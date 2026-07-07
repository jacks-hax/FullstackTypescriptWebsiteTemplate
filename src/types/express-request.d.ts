import { IAppData } from '@models/window';

declare module 'express-session' {
    export interface SessionData {
        userId?: string;
    }
}

declare module 'express' {
    export interface Request {
        appData?: IAppData;
    }
    export interface Response {
        cspNonce?: string;
    }
}

export {};
