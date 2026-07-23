import { JSX } from 'react';

export interface ReactEventDetail {
    path: string; // Path to component (like an identifier)
    component: JSX.Element;
}
export interface ReactEventInit extends CustomEventInit {
    detail: ReactEventDetail;
}
export class ReactEvent extends Event {
    detail: ReactEventDetail;
    constructor(eventType: string, init: ReactEventInit) {
        super(eventType, init);
        this.detail = init.detail;
    }
}
export type ReactEventListener = (event: ReactEvent) => void;

interface EventBusWindow extends Window {
    reactEventBusListeners: Record<string, Set<ReactEventListener>>;
}
declare const window: EventBusWindow;

if (!window.reactEventBusListeners) {
    window.reactEventBusListeners = {};
}

export default class ReactEventBus {
    private static get listeners() {
        return window.reactEventBusListeners;
    }

    // Component Path => Component
    private static componentCache: Record<string, JSX.Element> = {};

    public static readonly SYSTEM_EVENTS = {
        CMP_LOADED: '__CMP_LOADED__'
    };

    public static addEventListener(eventType: string, listener: ReactEventListener) {
        if (!ReactEventBus.listeners[eventType]) {
            ReactEventBus.listeners[eventType] = new Set<ReactEventListener>([listener]);
        } else {
            ReactEventBus.listeners[eventType].add(listener);
        }
        console.log('Added event listener for', eventType, listener);
        const cachedPaths = Object.keys(ReactEventBus.componentCache);
        if (cachedPaths.length) {
            listener(
                new ReactEvent(ReactEventBus.SYSTEM_EVENTS.CMP_LOADED, {
                    detail: {
                        component: ReactEventBus.componentCache[cachedPaths[0]],
                        path: cachedPaths[0]
                    }
                })
            );
        }
    }

    public static removeEventListener(eventType: string, listener: ReactEventListener) {
        if (ReactEventBus.listeners[eventType]?.has(listener)) {
            ReactEventBus.listeners[eventType].delete(listener);
        }
    }

    public static publish(event: ReactEvent) {
        console.log('publishing react event', event);
        if (!ReactEventBus.listeners[event.type]) {
            console.log('No listeners...');
            this.componentCache[event.detail.path] = event.detail.component;
            return;
        }
        Array.from(ReactEventBus.listeners[event.type]).forEach((listener) => {
            try {
                listener(event);
            } catch (error) {
                console.error(error);
            }
        });
    }

    public static componentLoaded(path: string, component: JSX.Element) {
        ReactEventBus.publish(
            new ReactEvent(ReactEventBus.SYSTEM_EVENTS.CMP_LOADED, {
                detail: {
                    component,
                    path
                }
            })
        );
    }
}
