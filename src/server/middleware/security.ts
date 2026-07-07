import { Request, Response } from 'express';
//import type { IncomingMessage, ServerResponse } from 'node:http';
import helmet from 'helmet';
export const CSPLoader = (_: Request, response: Response, next: Function) => {
    response.cspNonce = crypto.randomUUID();
    next();
};
export const Helmet = helmet({
    strictTransportSecurity: true,
    hidePoweredBy: true
    //contentSecurityPolicy: {
    //    directives: {
    //        'script-src': [
    //            "'self'",
    //            (_: IncomingMessage, response: ServerResponse) => {
    //                console.log('helmet csp custom function:', response.cspNonce);
    //                return response.cspNonce ?? 'none';
    //            }
    //        ]
    //    },
    //    useDefaults: true
    //}
});
