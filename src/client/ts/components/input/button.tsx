import * as React from 'react';
import { AbstractInputProps } from '@client/components/input/peripherals';

export interface ButtonProps extends AbstractInputProps {
    type?: 'submit' | 'reset' | 'button';
    onClick: React.MouseEventHandler<HTMLButtonElement>;
}

const DEFAULT_CLASSES = 'btn btn-primary';

export default function Button(props: ButtonProps) {
    const [className, setClassName] = React.useState<string>(props.className ?? DEFAULT_CLASSES);

    React.useEffect(() => {
        let cn = props.className ?? DEFAULT_CLASSES;
        if (!cn.includes('btn')) {
            cn += 'btn';
        }
        setClassName(cn);
    }, [props.className]);
    return (
        <button
            id={props.id}
            name={props.name}
            type={props.type}
            title={props.label}
            disabled={props.disabled}
            className={className}
            style={props.style}
            onClick={props.onClick}
        >
            {props.label}
        </button>
    );
}
