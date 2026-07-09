import * as React from 'react';
import * as InternalEvents from '@client/events';
import { WysiInit } from 'wysi';
import * as EventUtils from '@client/events/utils';
import {
    AbstractInputHandle,
    AbstractInputProps,
    InputLabel,
    InputSubtext
} from '@client/components/input/peripherals';

export interface WYSIWYGProps extends AbstractInputProps {
    minLength?: number;
    maxLength?: number;
    placeholder?: string;
    onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onKeyUp?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onEnter?: (event: InternalEvents.EnterEvent<HTMLTextAreaElement>) => void;
}

const WYSI_SRC_URL = `${window.location.origin}/static/deps/wysi/wysi.min.js`;
const WYSI_CSS_URL = `${window.location.origin}/static/deps/wysi/wysi.min.css`;

declare const Wysi: WysiInit;

function WYSIWYG(props: WYSIWYGProps, ref: React.ForwardedRef<AbstractInputHandle>) {
    /**
     * ------------------------------------------
     * --------------- STATE --------------------
     * ------------------------------------------
     */
    const [currentValue, setValue] = React.useState<string>(props.value?.toString() ?? '');
    const [error, setError] = React.useState<string | undefined>(props.error);

    /**
     * ------------------------------------------
     * ---------------- REFS --------------------
     * ------------------------------------------
     */
    const inputRef = React.useRef<HTMLTextAreaElement>(null);
    const wysiScriptRef = React.useRef<HTMLScriptElement>(null);

    /**
     * ------------------------------------------
     * ------------ EVENT HANDLERS --------------
     * ------------------------------------------
     */

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (props.onKeyDown) {
            props.onKeyDown(event);
        }
        if (!event.defaultPrevented && EventUtils.isEnterKeyPress(event) && reportValidity() && props.onEnter) {
            props.onEnter(new InternalEvents.EnterEvent({}, event.currentTarget));
        }
    };

    const handleKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (props.onKeyUp) {
            props.onKeyUp(event);
        }
    };

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>): void => {
        reportValidity();
        if (props.onBlur) {
            props.onBlur(event);
        }
    };

    const handleChangeRaw = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
        console.log('raw change event', event);
    };

    const handleChange = (content: string) => {
        setValue(content);
        console.log('wysiwg change event', content);
        if (props.onChange) {
            props.onChange(
                new InternalEvents.ChangeEvent<HTMLTextAreaElement>(
                    {
                        detail: { value: content }
                    },
                    inputRef.current
                )
            );
        }
    };

    /**
     * ------------------------------------------
     * --------------- HELPERS ------------------
     * ------------------------------------------
     */
    const checkValidity = (): boolean => {
        return !!inputRef.current?.checkValidity();
    };

    const reportValidity = (): boolean => {
        if (checkValidity()) {
            setError(undefined);
            return true;
        }
        if (props.messageWhenBadInput) {
            setError(props.messageWhenBadInput);
        } else if (props.required && !currentValue.length) {
            setError('This field is required.');
        } else if (null != props.minLength && currentValue.length < props.minLength) {
            setError(`This field must be at least ${props.minLength} characters long.`);
        } else if (null != props.maxLength && currentValue.length > props.maxLength) {
            setError(`This field must be at most ${props.maxLength} characters long.`);
        } else {
            setError('This value is invalid.');
        }
        return false;
    };

    const focus = (): void => {
        inputRef.current?.focus();
    };

    const setCustomValidity = () => {};

    const initWysiScript = () => {
        if (wysiScriptRef.current) {
            return;
        }
        const wysiCss = document.createElement('link');
        wysiCss.rel = 'stylesheet';
        wysiCss.href = WYSI_CSS_URL;
        document.body.appendChild(wysiCss);
        wysiCss.addEventListener('load', () => {
            console.log('wysi css loaded!');
        });

        const wysiScript = document.createElement('script');
        wysiScript.src = WYSI_SRC_URL;
        document.body.appendChild(wysiScript);
        wysiScript.addEventListener('load', () => {
            console.log('wysi script loaded, initializing now...');
            const result = Wysi({
                el: `#${props.id}`,
                onChange: handleChange
            });
            console.log('Wysi result:', result);
        });
    };

    /**
     * ------------------------------------------
     * ------------- REACT HOOKS ----------------
     * ------------------------------------------
     */
    React.useImperativeHandle(ref, () => ({
        checkValidity,
        reportValidity,
        setCustomValidity,
        focus
    }));

    React.useEffect(() => {
        initWysiScript();
    }, []);

    /**
     * ------------------------------------------
     * ------------- RENDERING ------------------
     * ------------------------------------------
     */

    const showLabel = props.variant !== 'label-hidden' && !!props.label?.length;
    console.log('Show label:', showLabel, 'label:', props.label);
    return (
        <div id={`${props.id}Wrapper`} className={props.className}>
            {showLabel && <InputLabel inputId={props.id} label={props.label} required={props.required} />}
            <textarea
                ref={inputRef}
                id={props.id}
                name={props.name}
                value={currentValue}
                required={props.required}
                disabled={props.disabled}
                minLength={props.minLength}
                maxLength={props.maxLength}
                placeholder={props.placeholder}
                aria-describedby={`${props.id}Subtext`}
                aria-label={props.label}
                onChange={handleChangeRaw}
                onKeyUpCapture={handleKeyUp}
                onKeyDownCapture={handleKeyDown}
                onFocus={props.onFocus}
                onBlur={handleBlur}
                className={`form-control ${error ? 'is-invalid' : ''}`}
            />
            <InputSubtext inputId={props.id} description={props.description} error={error} />
        </div>
    );
}

export default React.forwardRef(WYSIWYG);
