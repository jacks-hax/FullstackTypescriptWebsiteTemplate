import * as React from 'react';

import INavNode from '@models/nav';
import { IHeader } from '@models/window';

export default function DesktopHeader(props: IHeader): React.JSX.Element {
    /**
     * ----------------------------------------
     * -------------- STATE -------------------
     * ----------------------------------------
     */

    const [menuItems, setMenuItems] = React.useState<Array<INavNode>>(props.menuItems);

    /**
     * ----------------------------------------
     * ------------ EVENT HANDLERS ------------
     * ----------------------------------------
     */

    const handleFocusMenuItem = (event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>) => {
        const menuItem = (event.currentTarget.querySelector('ul.sub-menu') ??
            event.currentTarget.closest('ul.submenu')) as HTMLLIElement | null;
        if (menuItem) {
            menuItem.style.left = 'auto';
        }
    };

    const handleBlurMenuItem = (event: React.FocusEvent<HTMLLIElement> | React.MouseEvent<HTMLLIElement>) => {
        const menuItem = (event.currentTarget.querySelector('ul.sub-menu') ??
            event.currentTarget.closest('ul.submenu')) as HTMLLIElement | null;
        if (menuItem) {
            menuItem.style.left = '-999em';
        }
    };

    /**
     * ----------------------------------------
     * ---------- EFFECTS & HANDLES -----------
     * ----------------------------------------
     */

    React.useEffect(() => setMenuItems(props.menuItems), [props.menuItems]);

    /**
     * ----------------------------------------
     * -------------- RENDERING ---------------
     * ----------------------------------------
     */
    const renderMenuItems = (items: Array<INavNode>): React.JSX.Element => {
        return (
            <React.Fragment>
                {items.map((menuItem: INavNode) => {
                    if (!menuItem.Title || !menuItem.Id || !menuItem.Url) {
                        console.warn('Invalid menu item:', menuItem);
                        return;
                    }
                    let childrenElement: React.JSX.Element = <></>;
                    if (!!menuItem.Children?.length) {
                        childrenElement = <ul className='sub-menu'>{renderMenuItems(menuItem.Children)}</ul>;
                    }
                    const itemCurrentClass =
                        menuItem.Url === window.location.href ? 'current-menu-item current_page_item' : '';
                    const classList = `menu-item menu-item-${menuItem.Id} ${itemCurrentClass}`;
                    let windowTarget = '_self';
                    try {
                        if (new URL(menuItem.Url).origin !== window.location.origin) {
                            windowTarget = '_blank';
                        }
                    } catch {}

                    // If the menu item has a parent, render it as a child item
                    let content = <>{menuItem.Title}</>;
                    if (menuItem.ParentId) {
                        content = (
                            <div className='menu-item-content'>
                                {menuItem.IconUrl && (
                                    <div className='menu-item-icon'>
                                        <img src={menuItem.IconUrl} alt={menuItem.Description} />
                                    </div>
                                )}
                                <div className='menu-item-details'>
                                    <div className='menu-item-title'>{menuItem.Title}</div>
                                    <div className='menu-item-description'>{menuItem.Description}</div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <li
                            key={menuItem.Id}
                            id={`menu-item-${menuItem.Id}`}
                            title={menuItem.Title}
                            className={classList}
                            onFocus={handleFocusMenuItem}
                            onMouseEnter={handleFocusMenuItem}
                            onBlur={handleBlurMenuItem}
                            onMouseLeave={handleBlurMenuItem}
                        >
                            <a id={menuItem.Id} href={menuItem.Url} target={windowTarget} aria-current='page'>
                                {content}
                            </a>
                            {childrenElement}
                        </li>
                    );
                })}
            </React.Fragment>
        );
    };

    return (
        <React.Fragment>
            <div className='col'>
                <nav id='site-navigation' className='ap-header-nav main-navigation'>
                    <div className='menu-menu-1-container'>
                        <ul id='primary-menu' className='menu'>
                            {renderMenuItems(menuItems)}
                        </ul>
                    </div>
                </nav>
            </div>
        </React.Fragment>
    );
}
