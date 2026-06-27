import * as React from 'react';

import { NavNode } from 'nav-types';

// Components
import Frame from '@client/components/frame/frame';
import NavigationMenu from '@client/components/navigation-menu/navigation-menu';

export interface HomeScreenProps {
    navigationNodes: Array<NavNode>;
}
export default function HomeScreen(props: HomeScreenProps) {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */
    //const [showSpinner, setShowSpinner] = React.useState<boolean>(false);

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */
    const currentLocationIndexRef = React.useRef<number>(0);

    /**
     * ------------------------------------------
     * ------------ EVENT HANDLERS --------------
     * ------------------------------------------
     */
    function handleNavigate(node: NavNode) {}

    /**
     * ------------------------------------------
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */
    return (
        <Frame title='test'>
            <NavigationMenu
                navigationNodes={props.navigationNodes}
                currentLocation={currentLocationIndexRef.current}
                onNavigate={handleNavigate}
            />
            <>
                <h1>Hello, world!</h1>
            </>
        </Frame>
    );
}
