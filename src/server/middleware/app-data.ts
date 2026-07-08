import ModuleEventBus, { ModuleEvent } from '@utils/events/module-event-bus';
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

let databaseResolved = false;
let databaseResolve: Function = () => {
    databaseResolved = true;
};
let refreshCachePromise = new Promise<void>(async (resolve) => {
    if (databaseResolved) {
        await refreshCache();
        return resolve();
    }
    databaseResolve = async () => {
        await refreshCache();
        return resolve();
    };
});

export default async function AppData(_: Request, response: Response, next: Function) {
    await refreshCachePromise;
    response.appData = APP_DATA_CACHE;
    next();
}

function handleModuleReady(event: ModuleEvent) {
    if (event.detail.module.name === 'Database') {
        databaseResolve();
    }
}

ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, handleModuleReady);
