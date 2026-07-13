import { createRoot, Root } from 'react-dom/client';
import { JSX } from 'react';
import Constants from '@constants/client';

interface ReactInitializationEventData {
    type: typeof Constants.REACT_HEADER_MOUNTED_EVENT_TYPE | typeof Constants.REACT_INIT_CMP_EVENT_NAME;
    cmp?: JSX.Element;
}

export default class ReactUtils {
    private static root: Root | null;
    private static onRoot: () => void;

    static {}

    public static mountApp(cmp: JSX.Element): void {
        if (ReactUtils.root) {
            ReactUtils.root.render(cmp);
        } else {
            ReactUtils.onRoot = () => {
                if (!ReactUtils.root) {
                    return;
                }
                ReactUtils.root.render(cmp);
            };
        }
    }

    public static setBody(cmp: JSX.Element): void {
        const data: ReactInitializationEventData = {
            type: Constants.REACT_INIT_CMP_EVENT_NAME,
            cmp
        };
        const dispatchInitEvent = () => {
            window.dispatchEvent(
                new MessageEvent('message', {
                    bubbles: true,
                    composed: true,
                    cancelable: false,
                    data
                })
            );
        };

        dispatchInitEvent();

        // Listen for the header mounted event and re-emit the init cmp event when
        const messageHandler = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) {
                return;
            }
            const data = event.data as Partial<ReactInitializationEventData>;
            if (data.type === Constants.REACT_HEADER_MOUNTED_EVENT_TYPE) {
                dispatchInitEvent();
                window.removeEventListener('message', messageHandler);
            }
        };
        window.addEventListener('message', messageHandler);
        setTimeout(() => window.removeEventListener('message', messageHandler), 60000);
    }
}
