import MenuRepository from '@database/repositories/menu';
import { Request, Response } from 'express';
import { IAppData } from '@models/window';

const APP_DATA_CACHE: IAppData = {
    header: {
        logoUrl: '/static/images/logo.png',
        menuItems: []
    },
    footer: {
        menuItems: []
    }
};

async function refreshCache(): Promise<void> {
    APP_DATA_CACHE.header.menuItems = await MenuRepository.getHeaderMenuItems();
    APP_DATA_CACHE.footer.menuItems = await MenuRepository.getFooterMenuItems();
}

let refreshCachePromise = refreshCache();

export default async function AppData(request: Request, _: Response, next: Function) {
    await refreshCachePromise;
    request.appData = APP_DATA_CACHE;
    next();
}
