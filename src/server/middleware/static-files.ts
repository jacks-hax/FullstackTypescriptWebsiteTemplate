import Express, { Request, Response } from 'express';
import { IAppData } from '@models/window';
import Constants from '@constants/shared';
import StringUtils from '@utils/string';
import Utils from '@utils/utils';
import path from 'path';
import url from 'url';
import fs from 'fs';

interface FileNode {
    [key: string]: true | FileNode;
}

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../../public');
const CACHEABLE_FILE_TYPES = new Set<string>(['js', 'css', 'html']);

const TEMPLATE_DATA_GLOBAL: Record<string, string> = {
    application_name: "Jack's Hacks",
    description: "Jack's Hacks",
    theme_color: 'black',
    host: process.env.SERVER_HOST_NAME
};
const TEMPLATE_FILE_PATH = path.resolve(PUBLIC_DIR, 'index.html');
const TEMPLATE_HTML = StringUtils.merge(fs.readFileSync(TEMPLATE_FILE_PATH).toString(), TEMPLATE_DATA_GLOBAL);

const STATIC_DIR = path.resolve(PUBLIC_DIR, 'static');
const STATIC_CACHE: Record<string, Buffer> = {};
const STATIC_CACHE_MAX_HEAP = 1000 * 1000 * 10;
let staticCacheEnabled = false;

function countStaticFilesSize(): number {
    return Object.values(STATIC_CACHE).reduce((sum, file) => sum + file.length, 0);
}

function isCacheable(filePath: string): boolean {
    if (!CACHEABLE_FILE_TYPES.has(filePath.match(/.*\.([a-z]+)$/)?.[1] ?? '')) {
        return false;
    }
    return fs.statSync(filePath).size < STATIC_CACHE_MAX_HEAP / 2;
}

function cacheStaticFile(filePath: string, fileBuffer: Buffer) {
    if (!staticCacheEnabled) {
        return;
    }
    // If the new file fits within the cache limits, add it right away
    if (countStaticFilesSize() + fileBuffer.length < STATIC_CACHE_MAX_HEAP) {
        STATIC_CACHE[filePath] = fileBuffer;
        return;
    }
    // Otherwise, we need to de-cache a file that will give us enough space to cache the new file
    let fileToDecache;
    let sizeJustLargeEnough = STATIC_CACHE_MAX_HEAP + 1;
    Object.entries(STATIC_CACHE).forEach(([key, cachedBuffer]) => {
        if (cachedBuffer.length > fileBuffer.length && cachedBuffer.length < sizeJustLargeEnough) {
            sizeJustLargeEnough = cachedBuffer.length;
            fileToDecache = key;
        }
    });
    if (fileToDecache) {
        console.log('Caching newly cachable file:', filePath);
        delete STATIC_CACHE[fileToDecache];
        STATIC_CACHE[filePath] = fileBuffer;
    } else {
        console.warn('Unable to cache static file ', filePath, fileBuffer.length);
    }
}

function cacheStaticFilesRecursive(filePath: string, size: number = 0): number {
    if (!staticCacheEnabled) {
        return 0;
    }
    if (fs.statSync(filePath).isDirectory()) {
        let addedBytes = 0;
        fs.readdirSync(filePath).forEach(
            (subFile) => (addedBytes += cacheStaticFilesRecursive(path.resolve(filePath, subFile), size))
        );
        return addedBytes;
    } else if (isCacheable(filePath)) {
        const relativePath = filePath.replace(PUBLIC_DIR, '');
        const fileBuffer = fs.readFileSync(filePath);
        if (fileBuffer.length + size > STATIC_CACHE_MAX_HEAP) {
            return 0;
        }
        STATIC_CACHE[relativePath] = fileBuffer;
        return fileBuffer.length;
    }
    return 0;
}
if (staticCacheEnabled) {
    cacheStaticFilesRecursive(STATIC_DIR);
}

export function renderHtml(prefix: string, page: string, data: IAppData & Record<string, any>): string {
    if (page === '/' || page === '') {
        page = '/home';
    } else if (!page.startsWith('/')) {
        page = '/' + page;
    }
    return StringUtils.merge(TEMPLATE_HTML, {
        canonical_path: page,
        title: StringUtils.toTitle(page),
        page: `${prefix}${page}`,
        app_data: JSON.stringify(data)
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

function validateStaticPage(rootNode: FileNode, path: string): boolean {
    let currentNode: FileNode = rootNode;
    if (!path?.length || path === '/') {
        path = '/home';
    }
    for (const pathItem of path.split('/')) {
        if (pathItem.length === 0) continue;
        if (!currentNode[pathItem]) return false;
        if (currentNode[pathItem] === true) return true;
        if (currentNode[pathItem]['index.js'] === true) return true;
        currentNode = currentNode[pathItem];
    }
    return false;
}

export const SITE_INDEX: FileNode = {};

export default function StaticFiles(reactPathPrefix: string): Express.RequestHandler {
    const PAGES_DIR = path.resolve(__dirname, '../../public/static/js/', reactPathPrefix);
    const SHARED_PAGES_DIR = path.resolve(__dirname, '../../public/static/js/shared');
    if (!fs.existsSync(PAGES_DIR)) {
        throw new Error('React path prefix not found: ' + PAGES_DIR);
    }
    Object.assign(SITE_INDEX, indexStaticDir(PAGES_DIR));
    Object.assign(SITE_INDEX, indexStaticDir(SHARED_PAGES_DIR));
    return (request: Request, response: Response, next: Function) => {
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
            if (requestPath.startsWith('/static')) {
                const contentType = Utils.getContentType(path.basename(requestPath));
                response.setHeader(Constants.HEADERS.CONTENT_TYPE, contentType);
                if (!!STATIC_CACHE[requestPath]) {
                    response.status(200).send(STATIC_CACHE[requestPath]);
                    return;
                } else {
                    const staticPath = path.join(PUBLIC_DIR, requestPath);
                    if (fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
                        const buffer = fs.readFileSync(staticPath);
                        response.status(200).send(buffer);
                        if (isCacheable(staticPath)) {
                            cacheStaticFile(staticPath, buffer);
                        }
                        return;
                    } else {
                        return next();
                    }
                }
            } else {
                // If not in /static dir, check pages
                if (!validateStaticPage(SITE_INDEX, requestPath)) {
                    return next(); // This will resolve to a 404
                }
                response.setHeader(Constants.HEADERS.CONTENT_TYPE, Constants.CONTENT_TYPES.HTML);
                response.status(200).send(renderHtml(reactPathPrefix, requestPath, response.appData!));
                return;
            }
        } catch (error) {
            console.error('Static resolution error:', error);
            return next();
        }
    };
}
