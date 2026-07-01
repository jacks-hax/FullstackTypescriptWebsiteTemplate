import * as React from 'react';

// Third party libs
import purify from 'dompurify';

// Utilities
import BrowserUtils from '@client/utils/browser';
import NavUtils from '@client/utils/nav';

// Input components
import SearchBar, { type SearchBarHandle } from '@client/components/input/search-bar';

// Events & Toasts
import Toast from '@client/components/toast';
import { EnterEvent } from '@client/events';
import { publish, subscribe, unsubscribe } from '@client/events/pub-sub';

// Types & Models
import INavNode from '@models/nav';
import toast from '@client/components/toast';

export interface NavigationMenuProps {
    navigationNodes: Array<INavNode>;
    currentLocationIndex: number;
    onNavigate: (location: INavNode) => void;
}

function NavigationMenu(props: NavigationMenuProps, ref: React.ForwardedRef<HTMLDivElement>): React.JSX.Element {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */
    const [searchResults, setSearchResults] = React.useState<Array<INavNode>>([]);
    const [scrollWrapperHeight, setScrollWrapperHeight] = React.useState<number>(document.body.clientHeight);
    const [isMobile, setIsMobile] = React.useState<boolean>(
        BrowserUtils.isMobileBrowser() || BrowserUtils.isMobileScreenSize()
    );

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */
    const scrollWrapperRef = React.useRef<HTMLDivElement>(null);
    const searchBarRef = React.useRef<SearchBarHandle>(null);
    const currentLocationRef = React.useRef<INavNode | null>(props.navigationNodes[0]);

    /**
     * ------------------------------------------
     * ----------- EVENT HANDLERS ---------------
     * ------------------------------------------
     */

    const handleSearch = (event: EnterEvent<HTMLInputElement>): void => {
        const searchTerm = event.detail.value;
        if (!searchTerm?.length) {
            setSearchResults([]);
            return;
        }
        // TODO: Implement search
    };

    const handleCollapseSearchBar = (): void => {
        setSearchResults([]);
    };

    const handleSelectSearchResult = (result: INavNode): void => {
        if (!result.Id) {
            throw new Error('Search result missing Id.');
        }
        navigate(result.Id);
    };

    const handleClickNavigationItem = (
        event: React.MouseEvent<HTMLAnchorElement | HTMLLIElement | HTMLButtonElement, MouseEvent>
    ): void => {
        event.preventDefault();
        const target = event.currentTarget;
        if (target instanceof HTMLAnchorElement) {
            navigate(target.id);
            return;
        }
        const isLink = target.getAttribute('data-is-link') === 'true';
        if (!isLink) {
            return;
        }
        const href = target.getAttribute('data-href');
        if (href) {
            navigate(href);
        } else {
            Toast.showToast({
                message: 'Sorry, but a link for this item could not be found. Please try again later.',
                title: 'Navigation Error',
                variant: 'error'
            });
        }
    };

    /**
     * ------------------------------------------
     * ----------- HELPER METHODS ---------------
     * ------------------------------------------
     */

    const navigate = (id: string) => {
        const node = NavUtils.findNode(id, props.navigationNodes);
        if (!node) {
            toast.showToast({
                title: 'Error',
                message: 'Unable to locate selected page. This issue has been reported.'
            });
            return;
        }
        props.onNavigate(node);
        if (isMobile) {
            publish('header:menu:close');
        }
    };

    const resizeNavMenu = (event?: Event) => {
        if (event?.type === 'load') {
            window.removeEventListener('load', resizeNavMenu);
        }
        if (!scrollWrapperRef.current) {
            return;
        }
        const newScrollWrapperHeight = document.body.clientHeight - scrollWrapperRef.current.offsetTop;
        if (scrollWrapperHeight !== newScrollWrapperHeight) {
            setScrollWrapperHeight(newScrollWrapperHeight);
        }
    };

    /**
     * ------------------------------------------
     * --------------- EFFECTS ------------------
     * ------------------------------------------
     */

    // When the component mounts, initialize listeners
    React.useEffect(() => {
        subscribe('ismobile', setIsMobile);
        window.addEventListener('resize', resizeNavMenu);
        window.addEventListener('load', resizeNavMenu);
        resizeNavMenu();
        return () => {
            window.removeEventListener('resize', resizeNavMenu);
            window.removeEventListener('load', resizeNavMenu);
            unsubscribe('ismobile', resizeNavMenu);
        };
    }, []);

    // When the current node location changes, scroll the active nav item into view
    React.useEffect(() => {
        const activeNavItem = document.querySelector('.nav-link.active') as HTMLElement | null;
        if (activeNavItem) {
            activeNavItem.scrollIntoView(true);
            activeNavItem.focus();
        }
    }, [props.currentLocationIndex, scrollWrapperHeight]);

    /**
     * ------------------------------------------
     * ------------- RENDERING ------------------
     * ------------------------------------------
     */

    if (isMobile) {
        // We're in a mobile context. Render the mobile nav menu, but don't return it from this function.
        // The mobile nav menu is sent as an override to the MobileMenu component via the pub-sub system, with the header:mobile:menu:cmp event
        const renderNodes = (nodes: Array<INavNode>): React.ReactNode => {
            if (!nodes || nodes.length === 0) {
                return <p>No Items</p>;
            }
            return nodes.map((node) => {
                if (!node.Id || !node.Url || !node.Title) {
                    console.error('Invalid node:', node);
                    return;
                }
                if (!!node.Children?.length) {
                    return (
                        <div id={node.Id} key={node.Id} className='m-4 ms-4 me-3'>
                            <h6>{node.Title}</h6>
                            <nav className='flex-column align-items-stretch accordion accordion-flush'>
                                <nav className='nav nav-pills flex-column'>{renderNodes(node.Children)}</nav>
                            </nav>
                        </div>
                    );
                } else {
                    const isExpanded = currentLocationRef.current != null && node.Id === currentLocationRef.current.Id;
                    const buttonClassList = `accordion-button no-children ${isExpanded ? '' : 'collapsed'}`;
                    return (
                        <div key={node.Id} className='accordion-item'>
                            <h2 className='accordion-header'>
                                <button
                                    type='button'
                                    className={buttonClassList}
                                    aria-expanded={isExpanded}
                                    aria-controls={`accordion-${node.Id}`}
                                    data-bs-toggle='collapse'
                                    data-bs-target={`#accordion-${node.Id}`}
                                    data-path={node.Url}
                                    onClick={handleClickNavigationItem}
                                    dangerouslySetInnerHTML={{
                                        __html: purify.sanitize(node.Title)
                                    }}
                                ></button>
                            </h2>
                        </div>
                    );
                }
            });
        };

        const mobileNavMenu = (
            <div ref={ref} className='col-auto article_side-bar'>
                <div ref={scrollWrapperRef}>{renderNodes(props.navigationNodes)}</div>
            </div>
        );

        publish('header:mobile:menu:cmp', mobileNavMenu);
        publish(
            'header:mobile:widget:cmp',
            <SearchBar
                ref={searchBarRef}
                id='search'
                name='search'
                variant='icon'
                searchResults={searchResults}
                onSearch={handleSearch}
                onSelect={handleSelectSearchResult}
                onCollapse={handleCollapseSearchBar}
            />
        );

        return <></>;
    }

    const renderNodes = (nodes: Array<INavNode>): React.ReactNode => {
        if (!nodes || nodes.length === 0) {
            return <p>No items</p>;
        }
        return nodes.map((node) => {
            if (!node.Id || !node.Url || !node.Title) {
                console.error('Invalid node:', node);
                return;
            }
            const isSelected = node.Id === currentLocationRef.current?.Id;
            const activeClass = isSelected ? 'active' : '';
            return (
                <React.Fragment key={node.Id}>
                    <a
                        id={node.Id}
                        href={purify.sanitize(node.Url ?? '')}
                        className={`nav-link ms-3 ${activeClass}`}
                        onClick={handleClickNavigationItem}
                        dangerouslySetInnerHTML={{
                            __html: purify.sanitize(node.Title)
                        }}
                    ></a>
                    {!!node.Children?.length && renderNodes(node.Children)}
                </React.Fragment>
            );
        });
    };
    return (
        <div ref={ref} className='col-auto border-end article_side-bar'>
            <div className='border-bottom p-3'>
                <SearchBar
                    ref={searchBarRef}
                    id='search'
                    name='search'
                    variant='input'
                    searchResults={searchResults}
                    onSearch={handleSearch}
                    onSelect={handleSelectSearchResult}
                    onCollapse={handleCollapseSearchBar}
                />
            </div>

            <div ref={scrollWrapperRef} className='overflow-auto' style={{ height: scrollWrapperHeight }}>
                <nav className='flex-column align-items-stretch'>
                    <nav className='nav nav-pills flex-column'>{renderNodes(props.navigationNodes)}</nav>
                </nav>
            </div>
        </div>
    );
}

export default React.forwardRef(NavigationMenu);
