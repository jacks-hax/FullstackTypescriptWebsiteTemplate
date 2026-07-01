import * as React from 'react';

import Post from '@models/post';
import Input from '@client/components/input/input';
import * as InternalEvents from '@client/events/index';
import { AbstractInputHandle, HTMLAbstractInputElement } from '@client/components/input/peripherals';
import Spinner from '@client/components/spinner';
import toast from '@client/components/toast';

export interface PostFormProps {
    post: Post;
}
export default function PostForm(props: PostFormProps) {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */
    //const [showSpinner, setShowSpinner] = React.useState<boolean>(false);
    const [post, setPost] = React.useState<Post>(props.post);
    const [isValid, setIsValid] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */
    const inputRefs: { [key in keyof Post]: React.RefObject<AbstractInputHandle | null> } = {
        Title: React.useRef<AbstractInputHandle>(null),
        Slug: React.useRef<AbstractInputHandle>(null),
        Status: React.useRef<AbstractInputHandle>(null),
        Body: React.useRef<AbstractInputHandle>(null)
    };

    /**
     * ------------------------------------------
     * ---------------- EFFECTS -----------------
     * ------------------------------------------
     */
    React.useEffect(() => setPost(props.post), [props.post]);

    /**
     * ------------------------------------------
     * -------------- EVENT HANDLERS ------------
     * ------------------------------------------
     */
    const handleChange = (event: InternalEvents.ChangeEvent<HTMLAbstractInputElement>): void => {
        const param = event.currentTarget.name;
        const value = event.detail.value;
        setPost({
            ...post,
            [param]: value
        });
        checkValidity();
    };

    const handleClickSave = (): void => {
        if (reportValidity()) {
            submit();
        }
    };

    /**
     * ------------------------------------------
     * ---------------- HELPERS  ----------------
     * ------------------------------------------
     */
    const checkValidity = (): boolean => {
        let valid = true;
        Object.values(inputRefs).forEach((input) => {
            if (!input.current?.checkValidity()) {
                valid = false;
            }
        });
        setIsValid(valid);
        return valid;
    };

    const reportValidity = (): boolean => {
        let valid = true;
        Object.values(inputRefs).forEach((input) => {
            if (!input.current?.reportValidity()) {
                valid = false;
            }
        });
        setIsValid(valid);
        return valid;
    };

    const submit = async () => {
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            toast.showToast({
                title: 'Success!',
                message: 'Saved post'
            });
        }, 3000);
    };

    /**
     * ------------------------------------------
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */
    return (
        <div className='container'>
            {isLoading && <Spinner />}
            <div className='row'>
                <div className='col-9'>
                    <Input
                        ref={inputRefs.Title}
                        type='text'
                        id='title'
                        name='title'
                        label='Title'
                        value={post.Title}
                        minLength={2}
                        maxLength={64}
                        required
                        onChange={handleChange}
                    />
                </div>
                <div className='col'>
                    <button
                        type='button'
                        className='btn btn-outline-primary px-4'
                        disabled={!isValid}
                        onClick={handleClickSave}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
