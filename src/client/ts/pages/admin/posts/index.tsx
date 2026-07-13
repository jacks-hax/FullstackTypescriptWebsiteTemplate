import 'bootstrap';
import * as React from 'react';

// Types & Models
import AppWindow, { IAppData } from '@models/window';
import IPost from '@models/post';

// Utils
import ReactUtils from '@client/utils/react';

import PostsPage from './posts-list';

export interface FrameWindow extends AppWindow {
    AppData: IAppData & {
        posts: Array<IPost>;
    };
}
declare const window: FrameWindow;

try {
    const root = ReactUtils.createRoot('root');
    root.render(<PostsPage posts={window.AppData.posts} />);
} catch (error) {
    console.error(error);
}
