import * as React from 'react';
import Header from '@client/components/header/header';
import BrowserUtils from '@client/utils/browser';
import AppWindow from '@models/window';
import ReactEventBus, { ReactEvent } from '@client/utils/react-event-bus';
import Spinner from '@client/components/spinner';
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
            let linkUrl;
            if (href.startsWith('/')) {
                linkUrl = new URL(window.location.origin + href);
            } else if (/^http(s)?:\/\//.test(href)) {
                linkUrl = new URL(anchorLink.href);
            }
            if (!linkUrl || linkUrl.origin !== window.location.origin) {
                return;
            }
            event.preventDefault();
            BrowserUtils.loadScript(linkUrl.href);
            console.log('An anchor was clicked!');
        };
        document.documentElement.addEventListener('click', handleGlobalClick);
        return () => {
            ReactEventBus.removeEventListener(ReactEventBus.SYSTEM_EVENTS.CMP_LOADED, onComponentLoaded);
            document.documentElement.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    return (
        <div>
            <Header {...window.AppData.header} />
            <React.Suspense fallback={<Spinner />}>{bodyComponent}</React.Suspense>
        </div>
    );
}
