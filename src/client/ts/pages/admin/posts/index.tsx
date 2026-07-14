import 'bootstrap';
import * as React from 'react';

// Types & Models
import AppWindow, { IAppData } from '@models/window';
import IPost from '@models/post';

// Utils
import ReactEventBus from '@client/utils/react-event-bus';

// UI
import PostsPage from './posts-list';
import AppService from '@client/services/app-service';
import Toast from '@client/components/toast';

export interface FrameWindow extends AppWindow {
    AppData: IAppData & {
        posts?: Array<IPost>;
    };
}
declare const window: FrameWindow;

async () => {
    try {
        let posts = window.AppData.posts;
        if (!posts) {
            const appService = new AppService();
            await appService.applyCSRFToken();
            const response = await appService.get('/admin/posts');
            const payload = AppService.handle(response);
            console.log(payload);
        }
        ReactEventBus.componentLoaded('/admin/posts', <PostsPage posts={} />);
    } catch (error) {
        console.error(error);
        Toast.showErrorToast('Failed to load app!');
    }
};
