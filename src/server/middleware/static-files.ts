import { Request, Response } from 'express';
import path from 'path';
import url from 'url';
import fs from 'fs';
import Constants from '@constants/shared';
import Utils from '@utils/utils';
import StringUtils from '@utils/string';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../../public');

const TEMPLATE_DATA_GLOBAL: Record<string, string> = {
    application_name: "Jack's Hacks",
    description: "Jack's Hacks",
    theme_color: 'black',
    host: process.env.SERVER_HOST_NAME
};
const TEMPLATE_FILE_PATH = path.resolve(PUBLIC_DIR, 'index.html');
const TEMPLATE_HTML = StringUtils.merge(fs.readFileSync(TEMPLATE_FILE_PATH).toString(), TEMPLATE_DATA_GLOBAL);

const STATIC_DIR = path.resolve(PUBLIC_DIR, 'static');
const STATIC_CACHE: Record<string, string> = {};

function cacheStaticFiles(file: string) {
    if (fs.statSync(file).isDirectory()) {
        fs.readdirSync(file).forEach((subFile) => cacheStaticFiles(path.resolve(file, subFile)));
    } else {
        const relativePath = file.replace(PUBLIC_DIR, '');
        STATIC_CACHE[relativePath] = fs.readFileSync(file).toString();
    }
}
cacheStaticFiles(STATIC_DIR);
console.log(Object.keys(STATIC_CACHE));

//const PAGES_DIR = path.resolve(__dirname, '../../public/static/js/pages');
//const PAGES = fs.readdirSync(PAGES_DIR);

//function sendError(response: Response, statusCode: number): void {
//const renderedError = render(statusCode.toString());
//console.error('Sending error', statusCode, renderedError);
//response.setHeader(Constants.HEADERS.CONTENT_TYPE, Constants.CONTENT_TYPES.HTML);
//response.status(statusCode).send('fuckoff');
//}

export function renderHtml(page: string): string {
    if (page === '/' || page === '') {
        page = '/home';
    } else if (!page.startsWith('/')) {
        page = '/' + page;
    }
    console.log('Rendering page:', page);
    return StringUtils.merge(TEMPLATE_HTML, {
        canonical_path: page,
        title: StringUtils.toTitle(page),
        page
    });
}

export default async function serveStaticFile(request: Request, response: Response, next: Function) {
    try {
        let requestPath = request.path.replaceAll('..', '');
        while (requestPath.includes('//')) {
            requestPath = requestPath.replaceAll('//', '/');
        }

        console.log('requestPath:', requestPath);
        if (requestPath.startsWith('/static')) {
            const contentType = Utils.getContentType(path.basename(requestPath));
            response.setHeader(Constants.HEADERS.CONTENT_TYPE, contentType);
            if (!!STATIC_CACHE[requestPath]) {
                response.status(200).send(STATIC_CACHE[requestPath]);
            } else {
                const staticPath = path.resolve(PUBLIC_DIR, requestPath);
                if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
                    response.status(200).send(fs.readFileSync(staticPath).toString());
                } else {
                    next();
                }
            }
        } else {
            // TODO : Add validation for path here
            response.setHeader(Constants.HEADERS.CONTENT_TYPE, Constants.CONTENT_TYPES.HTML);
            response.status(200).send(renderHtml(requestPath));
        }
    } catch (error) {
        console.error('Static resolution error:', error);
        next();
    }
}
