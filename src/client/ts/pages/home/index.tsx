import 'bootstrap';
import * as React from 'react';

// Types & Models
import { NavNode } from 'nav-types';
import AppWindow, { WindowData } from 'window-types';

// Utils
import ReactUtils from '@client/utils/react';
import * as EventUtils from '@client/events/utils';
import HomeScreen from './home';

export interface FrameWindow extends AppWindow {
    AppData: WindowData & {
        navigationNodes: Array<NavNode>;
        currentLocation: NavNode;
        htmlContent: string;
    };
}

try {
    const root = ReactUtils.createRoot('root');
    const navigationNodes: Array<NavNode> = [
        {
            id: 'test',
            description: 'test description',
            label: 'test',
            name: 'test',
            icon: 'iconname',
            path: '/test',
            type: 'f'
        },
        {
            id: 'test2',
            description: 'test description 2',
            label: 'Test 2',
            name: 'test2',
            icon: 'iconname',
            path: '/test2',
            type: 'd'
        }
    ];
    root.render(<HomeScreen navigationNodes={navigationNodes} />);

    // Prevent the page from scrolling down when the space key is pressed
    window.addEventListener('keydown', function (e: Event) {
        if (EventUtils.isSpaceKeyPress(e as unknown as React.KeyboardEvent) && e.target == document.body) {
            e.preventDefault();
        }
    });
} catch (error) {
    console.error(error);
}
