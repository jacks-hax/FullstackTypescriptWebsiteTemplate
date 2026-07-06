import * as React from 'react';

import INavNode from '@models/nav';

// Components
import Frame from '@client/components/frame/frame';
import NavigationMenu from '@client/components/navigation-menu/navigation-menu';

export interface HomeScreenProps {
    navigationNodes: Array<INavNode>;
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
    function handleNavigate(_: INavNode) {}

    /**
     * ------------------------------------------
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */
    return (
        <Frame title='test'>
            <NavigationMenu
                navigationNodes={props.navigationNodes}
                currentLocationIndex={currentLocationIndexRef.current}
                onNavigate={handleNavigate}
            />
            <>
                <h1>Hello, world!</h1>
            </>
        </Frame>
    );
}
