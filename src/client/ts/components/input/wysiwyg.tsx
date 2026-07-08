import * as React from 'react';
import { Editor } from '@tinymce/tinymce-react';
//import * as InternalEvents from '@client/events';
//import * as EventUtils from '@client/events/utils';
import { AbstractInputHandle, AbstractInputProps } from '@client/components/input/peripherals';
export interface WYSIWYGProps extends AbstractInputProps {}
function WYSIWYG(props: WYSIWYGProps, ref: React.ForwardedRef<AbstractInputHandle>) {
    const editorRef = React.useRef<Editor>(null);
    const handleChange = (value: string, ref: Editor) => {
        console.log('wysiwg change event', value, ref);
        //props.onChange(
        //        new InternalEvents.ChangeEvent<HTMLInputElement>(
        //            {
        //                detail: { value: '' }
        //            },
        //        )
        //    );
    };

    const checkValidity = (): boolean => {
        return true;
    };

    const reportValidity = (): boolean => {
        return true;
    };

    const setCustomValidity = () => {};

    React.useImperativeHandle(ref, () => ({
        checkValidity,
        reportValidity,
        setCustomValidity,
        focus
    }));
    return (
        <Editor
            ref={editorRef}
            apiKey='no-api-key'
            id={props.id}
            initialValue={props.value?.toString()}
            onInit={(e, ref) => {
                console.log('Initialized editor:', e, ref);
            }}
            init={{
                height: 500,
                menubar: false,
                plugins: [
                    'advlist',
                    'autolink',
                    'lists',
                    'link',
                    'image',
                    'charmap',
                    'anchor',
                    'searchreplace',
                    'visualblocks',
                    'code',
                    'fullscreen',
                    'insertdatetime',
                    'media',
                    'table',
                    'preview',
                    'help',
                    'wordcount'
                ],
                toolbar:
                    'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | help',
                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
            }}
            onEditorChange={handleChange}
        />
    );
}

export default React.forwardRef(WYSIWYG);
