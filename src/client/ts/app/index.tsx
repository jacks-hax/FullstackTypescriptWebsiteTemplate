import * as React from 'react';
import * as ReactDom from 'react-dom/client';

// Components
import App from './app';

// Utils
import Constants from '@constants/client';
import Toast from '@client/components/toast';

// Types
import AppWindow from '@models/window';
import BrowserUtils from '@client/utils/browser';
declare const window: AppWindow;

// Ensure that the page always scrolls to the top when it is loaded or reloaded
BrowserUtils.scrollTopOnLoad();

// Prevent the page from scrolling down when the space key is pressed
BrowserUtils.preventSpacebarScrolling();

// Display any toasts that were stored in the cookies when the page was last loaded
Toast.showStoredToasts();

// Try to find the root element at all costs and render the app
async () => {
    try {
        let rootElement: HTMLElement | null;
        if (document.readyState === 'complete') {
            rootElement = document.getElementById(Constants.REACT_ROOT_ID);
        } else {
            rootElement = await new Promise<HTMLElement | null>((resolve) => {
                const onLoad = () => {
                    document.removeEventListener('load', onLoad);
                    resolve(document.getElementById(Constants.REACT_ROOT_ID));
                };
                document.addEventListener('load', onLoad);
            });
        }
        if (!rootElement) {
            throw new Error('Unable to locate root div for React.');
        }
        const root = ReactDom.createRoot(rootElement);
        root.render(<App />);
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to mount React root.';
        const errorElement = document.createElement('div');
        errorElement.innerHTML = `<h1>Error!</h1><p class="text-danger">${errorMessage}</p>`;
        document.body.appendChild(errorElement);
    }
};
