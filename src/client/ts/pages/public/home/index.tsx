import 'bootstrap';
import * as React from 'react';

// Types & Models
import INavNode from '@models/nav';
import AppWindow, { IAppData } from '@models/window';

// Utils
import ReactUtils from '@client/utils/react';
import * as EventUtils from '@client/events/utils';
import HomeScreen from './home';

export interface HomeWindow extends AppWindow {
    AppData: IAppData & {
        navigationNodes: Array<INavNode>;
        currentLocation: INavNode;
        htmlContent: string;
    };
}
declare const window: HomeWindow;

try {
    const root = ReactUtils.createRoot('root');
    root.render(<HomeScreen navigationNodes={window.AppData.navigationNodes} />);

    // Prevent the page from scrolling down when the space key is pressed
    window.addEventListener('keydown', function (e: Event) {
        if (EventUtils.isSpaceKeyPress(e as unknown as React.KeyboardEvent) && e.target == document.body) {
            e.preventDefault();
        }
    });
} catch (error) {
    console.error(error);
}
