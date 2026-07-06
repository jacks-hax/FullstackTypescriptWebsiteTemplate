import 'bootstrap';
import * as React from 'react';

// Types & Models
import AppWindow, { IAppData } from '@models/window';
import IPost from '@models/post';

// Utils
import ReactUtils from '@client/utils/react';
import * as EventUtils from '@client/events/utils';

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

    // Prevent the page from scrolling down when the space key is pressed
    window.addEventListener('keydown', function (e: Event) {
        if (EventUtils.isSpaceKeyPress(e as unknown as React.KeyboardEvent) && e.target == document.body) {
            e.preventDefault();
        }
    });
} catch (error) {
    console.error(error);
}
