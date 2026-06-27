import 'bootstrap';
import * as React from 'react';

import ReactUtils from '@client/utils/react';
import * as EventUtils from '@client/events/utils';

try {
    const root = ReactUtils.createRoot('root');
    root.render(
        <>
            <h1>Hello, world!</h1>
        </>
    );

    // Prevent the page from scrolling down when the space key is pressed
    window.addEventListener('keydown', function (e: Event) {
        if (EventUtils.isSpaceKeyPress(e as unknown as React.KeyboardEvent) && e.target == document.body) {
            e.preventDefault();
        }
    });
} catch (error) {
    console.error(error);
}
