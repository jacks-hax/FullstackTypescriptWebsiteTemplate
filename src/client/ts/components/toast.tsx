import * as React from 'react';
import { Toast as BootstrapToast } from 'bootstrap';
import { createRoot } from 'react-dom/client';

// Utils
import BrowserUtils from '@client/utils/browser';
import Constants from '@constants/client';
import { JsonApiException } from '@models/jsonapi';
// import { getTimeDifference } from '@client/utils/datetime';

//const MAX_PARALLEL_TOASTS = 3;

export interface ToastProps {
    id?: string;
    title: string;
    message: string;
    timestamp?: Date | string;
    variant?: 'success' | 'error';
    mode?: 'sticky' | 'pester' | 'fade';
    durationMs?: number;
    onDestroy?: () => void;
}

export interface ToastHandle extends ToastProps {
    show: () => void;
    hide: () => void;
    destroy: () => void;
}

export interface ToastContainerHandle {
    showToast(props: ToastProps): Promise<ToastHandle>;
    storeToast(props: ToastProps): void;
    showStoredToasts(): Promise<Array<ToastHandle>>;
}

const PERSISTANT_TOAST_KEY = 'app_toasts';

/**
 * @component
 * @description A single toast notification
 */
const SingleToast = React.forwardRef((props: ToastProps, ref: React.ForwardedRef<ToastHandle>): React.JSX.Element => {
    /**
     * ------------------------------------------
     * ---------------- REFS --------------------
     * ------------------------------------------
     */

    const idRef = React.useRef<string>(props.id ?? `${props.title}${props.message}${props.variant}`);
    const elementRef = React.useRef<HTMLDivElement | null>(null);
    const boostrapRef = React.useRef<BootstrapToast | null>(null);
    const fadeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const isDestroyed = React.useRef<boolean>(false);
    const renderCallback = React.useRef<Function | null>(null);

    /**
     * ------------------------------------------
     * ---------------- HELPERS -----------------
     * ------------------------------------------
     */

    const show = () => {
        if (boostrapRef.current) {
            boostrapRef.current.show();
        } else if (elementRef.current) {
            elementRef.current.classList.add('show');
        } else {
            console.error('Could not show toast');
            renderCallback.current = show;
        }
    };

    const hide = () => {
        if (boostrapRef.current) {
            boostrapRef.current.hide();
        } else if (elementRef.current) {
            elementRef.current.classList.remove('show');
        } else {
            console.error('Could not hide toast');
            renderCallback.current = hide;
        }
    };

    const destroy = () => {
        if (isDestroyed.current) {
            return;
        }
        isDestroyed.current = true;
        if (elementRef.current) {
            elementRef.current.removeEventListener('hidden.bs.toast', destroy);
        }
        if (boostrapRef.current) {
            boostrapRef.current.dispose();
        }
        if (typeof props.onDestroy === 'function') {
            props.onDestroy();
        }
        if (fadeTimeoutRef.current) {
            clearTimeout(fadeTimeoutRef.current);
        }
    };

    /**
     * ------------------------------------------
     * ------------- EVENT HANDLERS -------------
     * ------------------------------------------
     */

    const onRender = (element: HTMLDivElement | null) => {
        if (!element) {
            return;
        }
        elementRef.current = element;
        boostrapRef.current = BootstrapToast.getOrCreateInstance(element);
        if (!element.classList.contains('show')) {
            boostrapRef.current.show();
        }
        if (renderCallback.current != null) {
            renderCallback.current();
        }
        if (props.mode === 'pester' || props.mode === 'fade' || props.durationMs) {
            const duration = props.durationMs || 6000;
            fadeTimeoutRef.current = setTimeout(destroy, duration);
        }
        element.addEventListener('hidden.bs.toast', destroy);
    };

    /**
     * ------------------------------------------
     * --------------- LIFECYCLE ----------------
     * ------------------------------------------
     */

    React.useImperativeHandle(ref, () => ({
        show,
        hide,
        destroy,
        ...props,
        id: idRef.current
    }));

    /**
     * ------------------------------------------
     * --------------- RENDERING ----------------
     * ------------------------------------------
     */

    // const timestamp = props.timestamp && <small>{getTimeDifference(new Date(), props.timestamp)}</small>;
    const isSticky = props.mode === 'sticky' || props.variant === 'error';

    return (
        <div
            id={idRef.current}
            ref={onRender}
            className={`toast app-toast app-toast_${props.variant ?? 'neutral'}`}
            aria-atomic='true'
            data-bs-autohide={!isSticky}
            data-bs-delay={isSticky ? 0 : 3000}
            role={props.variant === 'error' ? 'alert' : 'status'}
            aria-live={props.variant === 'error' ? 'assertive' : 'polite'}
        >
            <div className='d-flex'>
                <div className='toast-body'>{props.message}</div>
                {/* <strong className='me-auto'>{props.title}</strong> */}
                {/* {timestamp} */}
                <div data-bs-theme='dark' className='me-2 m-auto'>
                    <button type='button' className='btn-close' data-bs-dismiss='toast' aria-label='Close'></button>
                </div>
            </div>
        </div>
    );
});

/**
 * @component
 * @description A container for toast notifications. The container has methods for showing and storing toasts.
 */
const ToastContainer = React.forwardRef((_: any, ref: React.ForwardedRef<ToastContainerHandle>) => {
    /**
     * ------------------------------------------
     * --------------- STATE --------------------
     * ------------------------------------------
     */

    const [toasts, setToasts] = React.useState<Record<string, ToastProps>>({});

    /**
     * ------------------------------------------
     * ---------------- REFS --------------------
     * ------------------------------------------
     */

    const containerRef = React.useRef<HTMLDivElement>(null);
    const toastRefs = React.useRef<Record<string, ToastHandle>>({});
    const toastCallbackRefs = React.useRef<Record<string, (handle: ToastHandle) => void>>({});

    /**
     * ------------------------------------------
     * ------------- EVENT HANDLERS -------------
     * ------------------------------------------
     */

    const handleDestroyToast = (id: string) => {
        const toast = toasts[id];
        if (typeof toast.onDestroy === 'function') {
            toast.onDestroy();
        }
        setToasts((prevToasts) => {
            const newToasts = { ...prevToasts };
            delete newToasts[id];
            return newToasts;
        });
    };

    /**
     * ------------------------------------------
     * ---------------- HELPERS -----------------
     * ------------------------------------------
     */

    const showToast = async (props: ToastProps): Promise<ToastHandle> => {
        const id = props.id ?? `${props.title}${props.message}${props.variant}`;
        if (!props.id) {
            props.id = id;
        }
        if (!toasts[id] || !toastRefs.current[id]) {
            setToasts((prevToasts) => ({ ...prevToasts, [id]: props }));
            return new Promise<ToastHandle>((resolve) => (toastCallbackRefs.current[id] = resolve));
        }
        return toastRefs.current[id];
    };

    const showStoredToasts = async (): Promise<Array<ToastHandle>> => {
        const toastPropsString = BrowserUtils.getCookie(PERSISTANT_TOAST_KEY);
        if (typeof toastPropsString !== 'string' || !toastPropsString?.length) {
            return [];
        }
        const toastProps = JSON.parse(toastPropsString) as Array<ToastProps>;
        BrowserUtils.setCookie(PERSISTANT_TOAST_KEY, undefined);
        return Promise.all(toastProps.map(showToast));
    };

    const storeToast = (props: ToastProps): void => {
        const existingToastsString = BrowserUtils.getCookie(PERSISTANT_TOAST_KEY);
        const toasts = [props];
        if (existingToastsString) {
            try {
                const existingToasts = JSON.parse(existingToastsString);
                toasts.push(...existingToasts);
            } catch (ignored) {}
        }
        BrowserUtils.setCookie(PERSISTANT_TOAST_KEY, JSON.stringify(toasts));
    };

    /**
     * ------------------------------------------
     * --------------- LIFECYCLE ----------------
     * ------------------------------------------
     */

    const onToastRender = React.useCallback((handle: ToastHandle | null) => {
        if (!handle?.id) {
            return;
        }
        toastRefs.current[handle.id] = handle;
        if (toastCallbackRefs.current[handle.id]) {
            toastCallbackRefs.current[handle.id](handle);
            delete toastCallbackRefs.current[handle.id];
        }
    }, []);

    React.useImperativeHandle(ref, () => ({
        showToast,
        showStoredToasts,
        storeToast
    }));

    /**
     * ------------------------------------------
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */

    return (
        <div ref={containerRef} className='toast-container app-toast-container p-3 start-50 translate-middle-x'>
            {Object.keys(toasts).map((id) => {
                return (
                    <SingleToast
                        key={id}
                        id={id}
                        ref={onToastRender}
                        onDestroy={() => handleDestroyToast(id)}
                        title={toasts[id].title}
                        message={toasts[id].message}
                        timestamp={toasts[id].timestamp}
                        variant={toasts[id].variant}
                        mode={toasts[id].mode}
                    />
                );
            })}
        </div>
    );
});

// This is a hack to ensure that the container is rendered before any toasts are shown
let containerHandle: ToastContainerHandle | null = null;
const callbacks: Array<(handle: ToastContainerHandle) => void> = [];
const onContainerRender = (handle: ToastContainerHandle | null) => {
    containerHandle = handle;
    if (!handle) {
        return;
    }
    while (callbacks.length) {
        const callback = callbacks.pop();
        if (typeof callback === 'function') {
            callback(handle);
        }
    }
};

// Generate a wrapper for the toast container and render it
function renderContainer() {
    const container = document.createElement('div');
    document.body.appendChild(container);
    createRoot(container).render(<ToastContainer ref={onContainerRender} />);
}
(() => {
    if (document.readyState === 'complete') {
        renderContainer();
    } else {
        document.addEventListener('load', () => renderContainer());
    }
})();

// Export proxies to the toast container handle methods. If the container is not yet rendered, store the method calls in a queue to be executed when the container is rendered.
export default class Toast {
    public static showToast(props: ToastProps): Promise<ToastHandle> {
        if (containerHandle) {
            return containerHandle.showToast(props);
        }
        return new Promise<ToastHandle>((resolve) => callbacks.push((handle) => resolve(handle.showToast(props))));
    }

    public static async showErrorToast(props: any): Promise<ToastHandle> {
        if (!props) {
            props = Constants.GENERIC_FORM_ERROR_MSG;
        }
        const errorProps: ToastProps = {
            variant: 'error',
            mode: 'sticky',
            title: 'Error',
            message: Constants.GENERIC_FORM_ERROR_MSG
        };
        if (typeof props === 'string') {
            errorProps.message = props;
        } else if (typeof props === 'object') {
            if (props instanceof Error) {
                errorProps.message = props.message;
            } else if (props instanceof JsonApiException) {
                let handle: ToastHandle | null = null;
                props.payload.errors?.forEach(async (error) => {
                    if (error.title && error.detail) {
                        handle = await Toast.showErrorToast({
                            title: error.title,
                            message: error.detail
                        });
                    }
                });
                if (handle) {
                    return handle;
                } else if (!!props.payload.data) {
                    if (typeof props.payload.data === 'string') {
                        errorProps.message = props.payload.data;
                    } else {
                        errorProps.message = props.payload.data.toString();
                    }
                }
            } else {
                Object.assign(errorProps, props);
                props.variant = 'error';
            }
        }
        return await Toast.showToast(errorProps);
    }

    public static showSuccessToast(props: ToastProps): Promise<ToastHandle> {
        props = {
            ...props,
            variant: 'success'
        };
        return Toast.showToast(props);
    }

    public static async showStoredToasts(): Promise<Array<ToastHandle>> {
        if (containerHandle) {
            return containerHandle.showStoredToasts();
        }
        return new Promise<Array<ToastHandle>>((resolve) =>
            callbacks.push((handle) => resolve(handle.showStoredToasts()))
        );
    }

    public static storeToast(props: ToastProps): void {
        if (containerHandle) {
            containerHandle.storeToast(props);
        } else {
            callbacks.push((handle) => handle.storeToast(props));
        }
    }
}
