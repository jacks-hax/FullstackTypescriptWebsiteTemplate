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
const TEMPLATE_FILE_PATH = path.resolve(CLIENT_DIR, 'index.html');

const TEMPLATE_DATA_GLOBAL: Record<string, string> = {
    application_name: "Jack's Hacks",
    description: "Jack's Hacks",
    theme_color: 'black',
    host: process.env.SERVER_HOST_NAME
};
const TEMPLATE_HTML = StringUtils.merge(fs.readFileSync(TEMPLATE_FILE_PATH).toString(), TEMPLATE_DATA_GLOBAL);

export function renderHtml(page: string, data: IAppData & Record<string, any>): string {
    if (!page.startsWith('/')) {
        page = '/' + page;
    }
    if (page === '/') {
        page = '';
    }
    return StringUtils.merge(TEMPLATE_HTML, {
        canonical_path: page,
        title: StringUtils.toTitle(page),
        page: `${page}`,
        app_data: JSON.stringify(data)
    });
}

export default function Static(gateway: string): Express.Router {
    console.log('Client Dir:', CLIENT_DIR);
    const staticPath = path.resolve(CLIENT_DIR, gateway, 'static');
    console.log('static path:', staticPath);
    const router = Express.Router();
    router.use(
        '/assets',
        Express.static(path.resolve(staticPath, 'assets'), {
            cacheControl: true,
            dotfiles: 'deny',
            fallthrough: true,
            redirect: false,
            maxAge: 36000,
            index: false
        })
    );

    router.use('/', (request: Request, response: Response, next: Function) => {
        try {
            if (request.method !== 'GET') {
                return next(); // Resolves to 404
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
