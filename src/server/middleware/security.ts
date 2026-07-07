import { Request, Response } from 'express';
import helmet from 'helmet';
export const CSPLoader = (_: Request, response: Response, next: Function) => {
    response.cspNonce = crypto.randomUUID();
    next();
};
export const Helmet = helmet({
    strictTransportSecurity: true,
    hidePoweredBy: true,
    contentSecurityPolicy: {
        directives: {
            'script-src': [(_: Request, response: Response) => `'${response.cspNonce}'`]
        },
        useDefaults: true
    }
});
