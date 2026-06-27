import * as React from 'react';

// Partial components
//import NavigationMenu from '@client/components/navigation-menu/navigation-menu';
//import Spinner from '@client/components/spinner';
//
//// Events & Toasts
////import Toast from '@client/components/toast';
//
//// Utils
//import BrowserUtils from '@client/utils/browser';
//import NavUtils from '@client/utils/nav';
//
//// Types & Models
//import { NavNode } from 'nav-types';

export interface FrameProps extends React.PropsWithChildren {
    title: string;
    logoUrl?: string;
}

export default function Frame(props: FrameProps): React.JSX.Element {
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
    //const contentContainerRef = React.useRef<HTMLDivElement>(null);
    //const navigationMenuRef = React.useRef<HTMLDivElement>(null);
    //const currentLocationRef = React.useRef<NavNode>(
    //    props.currentLocation ?? props.navigationNodes[props.currentLocationIndex ?? 0]
    //);

    /**
     * ------------------------------------------
     * ----------- EVENT HANDLERS ---------------
     * ------------------------------------------
     */

    //const handleNavigate = (targetLocation: NavNode): void => {
    //    setLocation(targetLocation);
    //};

    //const handleWindowPopState = (event: PopStateEvent) => {
    //    const targetLocation = NavUtils.findNode(window.location.pathname, props.navigationNodes);
    //    if (!targetLocation) {
    //        return;
    //    }
    //    const isCurrentLocation = targetLocation.id === currentLocationRef.current.id;
    //    // Firefox history.replaceState behaves like pushState, so we need to go back twice to avoid an infinite loop
    //    if (isCurrentLocation && BrowserUtils.isFirefox()) {
    //        event.preventDefault();
    //        event.stopPropagation();
    //        event.stopImmediatePropagation();
    //        window.history.back();
    //        window.history.back();
    //    } else if (targetLocation && !isCurrentLocation) {
    //        setLocation(targetLocation, true);
    //    }
    //};

    /**
     * ------------------------------------------
     * ----------- HELPER METHODS ---------------
     * ------------------------------------------
     */

    /**
     * @description Set the current article location and update the browser history
     *  The current article is set in the state and the ref because the ref is necessary for callbacks and the state is necessary for rendering
     * @param location The location to set as the current article
     */
    //const setLocation = (location: NavNode, replaceState: boolean = false) => {
    //    setShowSpinner(true);
    //    currentLocationRef.current = location;
    //    window.document.title = location.label;
    //    if (replaceState) {
    //        window.history.replaceState({}, '', location.path);
    //    } else {
    //        window.history.pushState({}, '', location.path);
    //    }
    //    setShowSpinner(false);
    //};

    /**
     * ------------------------------------------
     * --------------- EFFECTS ------------------
     * ------------------------------------------
     */

    // When the component initially mounts, attach event listeners
    //React.useEffect(() => {
    //    window.addEventListener('popstate', handleWindowPopState);
    //    return () => {
    //        window.removeEventListener('popstate', handleWindowPopState);
    //    };
    //}, []);

    /**
     * ------------------------------------------
     * ------------- RENDERING ------------------
     * ------------------------------------------
     */

    return (
        <div className='border-top'>
            <nav className='navbar navbar-expand-lg navbar-light bg-light'>
                <a className='navbar-brand' href='#'>
                    {props.title}
                </a>

                <div className='collapse navbar-collapse' id='navbarSupportedContent'>
                    <ul className='navbar-nav mr-auto'>
                        <li className='nav-item active'>
                            <a className='nav-link' href='#'>
                                Home <span className='sr-only'>(current)</span>
                            </a>
                        </li>
                        <li className='nav-item'>
                            <a className='nav-link' href='#'>
                                Link
                            </a>
                        </li>
                        <li className='nav-item dropdown'>
                            <a
                                className='nav-link dropdown-toggle'
                                href='#'
                                id='navbarDropdown'
                                role='button'
                                data-toggle='dropdown'
                                aria-haspopup='true'
                                aria-expanded='false'
                            >
                                Dropdown
                            </a>
                            <div className='dropdown-menu' aria-labelledby='navbarDropdown'>
                                <a className='dropdown-item' href='#'>
                                    Action
                                </a>
                                <a className='dropdown-item' href='#'>
                                    Another action
                                </a>
                                <div className='dropdown-divider'></div>
                                <a className='dropdown-item' href='#'>
                                    Something else here
                                </a>
                            </div>
                        </li>
                        <li className='nav-item'>
                            <a className='nav-link disabled' href='#'>
                                Disabled
                            </a>
                        </li>
                    </ul>
                    <form className='form-inline my-2 my-lg-0'>
                        <input
                            className='form-control mr-sm-2'
                            type='search'
                            placeholder='Search'
                            aria-label='Search'
                        />
                        <button className='btn btn-outline-success my-2 my-sm-0' type='submit'>
                            Search
                        </button>
                    </form>
                </div>
            </nav>
            <div className='d'>{props.children}</div>
        </div>
    );
}
