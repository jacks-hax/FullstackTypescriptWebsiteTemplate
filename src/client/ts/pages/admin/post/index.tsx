import 'bootstrap';
import * as React from 'react';

// Types & Models
import AppWindow, { IAppData } from '@models/window';
import IPost from '@models/post';

// Utils
import ReactUtils from '@client/utils/react';
import * as EventUtils from '@client/events/utils';

import PostForm from '@client/components/forms/posts-form';
import Toast from '@client/components/toast';

export interface FrameWindow extends AppWindow {
    AppData: IAppData & {
        post: IPost;
    };
}
declare const window: FrameWindow;

try {
    const root = ReactUtils.createRoot('root');
    const handleSave = (post: IPost) => {
        Toast.showToast({
            variant: 'success',
            title: 'Saved',
            message: 'Saved post ' + post.Id
        });
    };

    root.render(<PostForm post={window.AppData.post} onSave={handleSave} />);

    // Prevent the page from scrolling down when the space key is pressed
    window.addEventListener('keydown', function (e: Event) {
        if (EventUtils.isSpaceKeyPress(e as unknown as React.KeyboardEvent) && e.target == document.body) {
            e.preventDefault();
        }
    });
} catch (error) {
    console.error(error);
}
