import 'bootstrap';
import * as React from 'react';

// Page Components
import LoginForm from '@client/pages/shared/login/login-form';

// Utils
import ReactUtils from '@client/utils/react';
import * as EventUtils from '@client/events/utils';

import AppWindow from '@models/window';
declare const window: AppWindow;

try {
    const root = ReactUtils.createRoot('root');

    root.render(<LoginForm csrfToken={window.AppData.csrfToken} />);

    // Prevent the page from scrolling down when the space key is pressed
    window.addEventListener('keydown', function (e: Event) {
        if (EventUtils.isSpaceKeyPress(e as unknown as React.KeyboardEvent) && e.target == document.body) {
            e.preventDefault();
        }
    });
} catch (error) {
    console.error(error);
}
