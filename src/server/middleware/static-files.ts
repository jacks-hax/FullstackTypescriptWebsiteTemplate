import Express, { Request, Response } from 'express';
import path from 'path';
import url from 'url';
import fs from 'fs';
import Constants from '@constants/shared';
import Utils from '@utils/utils';
import StringUtils from '@utils/string';

interface FileNode {
    [key: string]: true | FileNode;
}

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

export function renderHtml(prefix: string, page: string): string {
    if (page === '/' || page === '') {
        page = '/home';
    } else if (!page.startsWith('/')) {
        page = '/' + page;
    }
    console.log('Rendering page:', prefix, page);
    return StringUtils.merge(TEMPLATE_HTML, {
        canonical_path: page,
        title: StringUtils.toTitle(page),
        page: `${prefix}/${page}`
    });
}

function indexStaticDir(dirname: string): FileNode {
    const indexDir = (_index: FileNode, _dirname: string) => {
        for (const node of fs.readdirSync(_dirname)) {
            const nodePath = path.resolve(_dirname, node);
            if (fs.statSync(nodePath).isDirectory()) {
                _index[node] = {};
                indexDir(_index[node], nodePath);
            } else {
                _index[node] = true;
            }
        }
    };
    const index: FileNode = {};
    indexDir(index, dirname);
    return index;
}

function validateStaticDir(index: FileNode, path: string): boolean {
    let currentIndex: FileNode = index;
    for (const pathItem of path.split('/')) {
        if (pathItem.length === 0) continue;
        if (!currentIndex[pathItem]) {
            return false;
        }
        const nextIndex = currentIndex[pathItem];
        if (nextIndex === true || ('index.js' in nextIndex && nextIndex['index.js'] === true)) {
            return true;
        }
        currentIndex = nextIndex;
    }
    return false;
}

export default function StaticFiles(reactPathPrefix: string): Express.RequestHandler {
    const PAGES_DIR = path.resolve(__dirname, '../../public/static/js/', reactPathPrefix);
    if (!fs.existsSync(PAGES_DIR)) {
        throw new Error('React path prefix not found: ' + PAGES_DIR);
    }
    const PAGE_INDEX: FileNode = indexStaticDir(PAGES_DIR);
    console.log('Page index:', PAGE_INDEX);
    return (request: Request, response: Response, next: Function) => {
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
                if (!validateStaticDir(PAGE_INDEX, requestPath)) {
                    return next(); // This will resolve to a 404
                }
                response.setHeader(Constants.HEADERS.CONTENT_TYPE, Constants.CONTENT_TYPES.HTML);
                response.status(200).send(renderHtml(reactPathPrefix, requestPath));
            }
        } catch (error) {
            console.error('Static resolution error:', error);
            next();
        }
    };
}
