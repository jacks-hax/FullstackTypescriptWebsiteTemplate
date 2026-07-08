import { IAppData } from '@models/window';

declare module 'express-session' {
    export interface SessionData {
        userId?: string;
    }
}

declare module 'express' {
    export interface Response {
        appData?: IAppData;
        cspNonce?: string;
    }
}

export {};
