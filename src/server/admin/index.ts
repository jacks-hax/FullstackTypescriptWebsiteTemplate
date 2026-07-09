/**
 * This file defines all exposed api endpoints for admins
 */
import Express from 'express';

import ModuleEventBus, { ModuleEvent } from '@utils/events/module-event-bus';
import { handle404, handleServerError } from '@middleware/error-handlers';
//import { CSPLoader, Helmet } from '@middleware/security';
import BodyParserMiddleware from '@middleware/body-parser';
import SessionMiddleware from '@middleware/session';
import AdminStaticPages from '@server/admin/static';
import AppData from '@middleware/app-data';
import API from '@server/admin/api';

const port = process.env.SERVER_PORT;
if (!port?.length) {
    throw new Error('Admin gateway port environment variable is not defined!');
}

// Initialize Express app
const app = Express();
app.disable('x-powered-by');
//app.use(CSPLoader);
//app.use(Helmet);
app.use(SessionMiddleware);
app.use(BodyParserMiddleware);
app.use('/api', API);
app.use(AppData);
app.use('/', AdminStaticPages);
app.use(handle404);
app.use(handleServerError);

// Wait for all async modules to initialize before starting the server
const asyncModules: Set<Function> = new Set<Function>();

function handleModuleInit(event: ModuleEvent) {
    console.log('Module initializing:', event.detail.module.name);
    asyncModules.add(event.detail.module);
}

function handleModuleError(event: ModuleEvent) {
    console.error('Error occurred while initializing', event.detail.module.name);
    console.error(event.detail.error);
    process.exit(1);
}

function handleModuleReady(event: ModuleEvent) {
    asyncModules.delete(event.detail.module);
    if (asyncModules.size) {
        return;
    }
    ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_INIT, handleModuleInit);
    ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, handleModuleReady);
    ModuleEventBus.removeEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_ERROR, handleModuleError);
    app.listen(port, () => {
        console.log(`Server is running on http://${process.env.SERVER_HOST_NAME}:${port}`);
    });
}

ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_INIT, handleModuleInit);
ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_READY, handleModuleReady);
ModuleEventBus.addEventListener(ModuleEventBus.SYSTEM_EVENTS.MODULE_ERROR, handleModuleError);
