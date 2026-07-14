import 'bootstrap';
import * as React from 'react';
import PostPage from '@client/pages/admin/post/post-page';

// Types & Models
import AppWindow, { IAppData } from '@models/window';
import IPost from '@models/post';

// Utils
import ReactEventBus from '@client/utils/react-event-bus';

export interface FrameWindow extends AppWindow {
    AppData: IAppData & {
        post: IPost;
    };
}
declare const window: FrameWindow;

try {
    ReactEventBus.componentLoaded('/admin/post', <PostPage post={window.AppData.post} />);
} catch (error) {
    console.error(error);
}
