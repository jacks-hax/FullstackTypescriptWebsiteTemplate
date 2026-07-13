import * as React from 'react';
import Header from '@client/components/header/header';
import BrowserUtils from '@client/utils/browser';
import AppWindow from '@models/window';
import ReactEventBus, { ReactEvent } from '@client/utils/react-event-bus';
declare const window: AppWindow;

export default function App(): React.JSX.Element {
    const [bodyComponent, setBodyComponent] = React.useState<React.JSX.Element>();
    const currentPathRef = React.useRef<string>(window.location.pathname);

    React.useEffect(() => {
        const onComponentLoaded = (event: ReactEvent) => {
            if (event.detail.path === currentPathRef.current) {
                setBodyComponent(event.detail.component);
            }
        };
        ReactEventBus.addEventListener(ReactEventBus.SYSTEM_EVENTS.CMP_LOADED, onComponentLoaded);

        // If the user clicks an anchor link, intercept same-origin navigation to
        const handleGlobalClick = (event: Event) => {
            const targetElement = (event.target ?? event.currentTarget) as HTMLElement;
            if (!BrowserUtils.findParentByTagName(targetElement, 'A')) {
                return;
            }
            const anchorLink = targetElement as HTMLAnchorElement;
            const href = anchorLink.href ?? '';
            let isSameOrigin = false;
            if (href.startsWith('/')) {
                isSameOrigin = true;
            } else if (/^http(s)?:\/\//.test(href)) {
                const url = new URL(anchorLink.href);
                if (url.origin === window.location.origin) {
                    isSameOrigin = true;
                }
            }
            if (!isSameOrigin) {
                return;
            }
            event.preventDefault();
            console.log('An anchor was clicked!');
        };
        document.documentElement.addEventListener('click', handleGlobalClick);
    }, []);
    return (
        <div>
            <Header {...window.AppData.header} />
            <React.Suspense></React.Suspense>
        </div>
    );
}
