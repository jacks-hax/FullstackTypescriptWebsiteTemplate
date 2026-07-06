import 'bootstrap';
import * as React from 'react';

// Page Components
import LoginForm from '@client/pages/public/login/login-form';

// Utils
import ReactUtils from '@client/utils/react';
import * as EventUtils from '@client/events/utils';

// Utilities
import BrowserUtils from '@client/utils/browser';

try {
    const root = ReactUtils.createRoot('root');
    const csrfToken = BrowserUtils.getCookie('csrftoken') ?? 'tmp';
    root.render(<LoginForm csrfToken={csrfToken} />);

    // Prevent the page from scrolling down when the space key is pressed
    window.addEventListener('keydown', function (e: Event) {
        if (EventUtils.isSpaceKeyPress(e as unknown as React.KeyboardEvent) && e.target == document.body) {
            e.preventDefault();
        }
    });
} catch (error) {
    console.error(error);
}
