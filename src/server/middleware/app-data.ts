import ModuleEventBus, { ModuleEvent } from '@utils/events/module-event-bus';
import MenuRepository from '@database/repositories/menu';
import { Request, Response } from 'express';
import { IAppData } from '@models/window';
import { randomUUID } from 'node:crypto';
import Utils from '@utils/utils';

const BASE_APP_DATA: IAppData = {
    header: {
        logoUrl: '/static/images/logo.png',
        menuItems: []
    },
    footer: {
        menuItems: []
    },
    tokens: {
        csrfToken: randomUUID()
    },
    serverInfo: {
        baseUrl: Utils.getServerBaseUrl(),
        siteIndex: {}
    }
};

async function refreshCache(): Promise<void> {
    BASE_APP_DATA.header.menuItems = await MenuRepository.getHeaderMenuItems();
    BASE_APP_DATA.footer.menuItems = await MenuRepository.getFooterMenuItems();
}

// since refreshCache depends on the database, we cannot call it until the database is ready
let databaseReady = false;
let onDatabaseReady: Function = () => {
    databaseReady = true;
};
let refreshCachePromise = new Promise<void>(async (resolve) => {
    if (databaseReady) {
        await refreshCache();
        return resolve();
    }
    onDatabaseReady = async () => {
        await refreshCache();
        return resolve();
    };
});

ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, (event: ModuleEvent) => {
    if (event.detail.module.name === 'Database') {
        onDatabaseReady();
    }
});

/**
 * @description Apply base AppData to response
 * @param _ Request is unmodified by this middleware
 * @param response AppData is applied to the response
 * @param next Always pass thru to next express handler
 */
export default async function AppData(_: Request, response: Response, next: Function) {
    await refreshCachePromise;
    response.appData = BASE_APP_DATA;
    response.appData.tokens.csrfToken = randomUUID();
    next();
}
