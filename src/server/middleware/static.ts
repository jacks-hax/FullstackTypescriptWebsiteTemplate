import Express, { Request, Response } from 'express';
import { IAppData } from '@models/window';
import Constants from '@constants/shared';
import StringUtils from '@utils/string';
import path from 'path';
import url from 'url';
import fs from 'fs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIR = path.resolve(__dirname, '../../client');

const TEMPLATE_DATA_GLOBAL: Record<string, string> = {
    application_name: "Jack's Hacks",
    description: "Jack's Hacks",
    theme_color: 'black',
    host: process.env.SERVER_HOST_NAME
};

export default function Static(gateway: string): Express.Router {
    console.log('Client Dir:', CLIENT_DIR);
    const scopedClientDir = path.resolve(CLIENT_DIR, gateway);

    // Cache the template html file used for rendering react files and define a function to render a react page
    const templateFilePath = path.resolve(scopedClientDir, 'index.html');
    const templateHtml = StringUtils.merge(fs.readFileSync(templateFilePath).toString(), TEMPLATE_DATA_GLOBAL);
    function renderHtml(pagePath: string, appData: IAppData & Record<string, any>): string {
        if (pagePath === '/') {
            pagePath = '';
        }
        return StringUtils.merge(templateHtml, {
            page: pagePath,
            canonical_path: pagePath,
            title: StringUtils.toTitle(pagePath),
            app_data: JSON.stringify(appData)
        });
    }

    // Route all /assets requests to a static file servlet
    const router = Express.Router();
    router.use(
        '/assets',
        Express.static(path.resolve(scopedClientDir, 'assets'), {
            cacheControl: true,
            dotfiles: 'deny',
            fallthrough: true,
            redirect: false,
            maxAge: 36000,
            index: false
        })
    );

    // Attempt to handle any fallthrough requests as react pages
    router.use('/', (request: Request, response: Response, next: Function) => {
        try {
            if (request.method !== 'GET') {
                return next(); // Falls through to 404
            }

            // Path sanatization
            let requestPath = request.path;
            if (request.page) {
                requestPath = '/' + request.page;
            }
            while (requestPath.includes('//')) {
                requestPath = requestPath.replaceAll('//', '/');
            }
            while (requestPath.includes('..')) {
                requestPath = requestPath.replaceAll('..', '');
            }
            if (!requestPath.startsWith('/')) {
                requestPath = '/' + requestPath;
            }

            console.log('static file requested:', requestPath);
            // If static file, check cache, then read from disk if necessary
            // If not in /static dir, check pages
            response.setHeader(Constants.HEADERS.CONTENT_TYPE, Constants.CONTENT_TYPES.HTML);
            response.status(200).send(renderHtml(requestPath, response.appData!));
            return;
        } catch (error) {
            console.error('Static resolution error:', error);
            return next();
        }
    });

    return router;
}
