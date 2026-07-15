import * as React from 'react';

// Types & Models
import AppWindow, { IAppData } from '@models/window';
import IPost from '@models/post';

// Utils
import ReactEventBus from '@client/utils/react-event-bus';

// UI
import PostsPage from './posts-list';

export interface FrameWindow extends AppWindow {
    AppData: IAppData & {
        posts?: Array<IPost>;
    };
}
declare const window: FrameWindow;

ReactEventBus.componentLoaded('/admin/posts', <PostsPage posts={window.AppData.posts ?? []} />);
