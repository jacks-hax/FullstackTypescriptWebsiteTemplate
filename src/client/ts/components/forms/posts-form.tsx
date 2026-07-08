import * as React from 'react';

// Models & Types
import * as InternalEvents from '@client/events';
import AppWindow from '@models/window';
import IPost from '@models/post';

// Components
import { AbstractInputHandle, HTMLAbstractInputElement } from '@client/components/input/peripherals';
import Wysiwyg from '@client/components/input/wysiwyg';
import Input from '@client/components/input/input';
import Spinner from '@client/components/spinner';
import Toast from '@client/components/toast';

import AppService from '@client/services/app-service';

declare const window: AppWindow;

export interface PostFormProps {
    post?: IPost;
    onSave: (post: IPost) => void;
}
export default function PostForm(props: PostFormProps) {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */
    //const [showSpinner, setShowSpinner] = React.useState<boolean>(false);
    const [post, setPost] = React.useState<IPost>(props.post ?? {});
    const [isValid, setIsValid] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */
    const inputRefs: { [key in keyof IPost]: React.RefObject<AbstractInputHandle | null> } = {
        Title: React.useRef<AbstractInputHandle>(null),
        Slug: React.useRef<AbstractInputHandle>(null),
        Status: React.useRef<AbstractInputHandle>(null)
    };

    /**
     * ------------------------------------------
     * ---------------- EFFECTS -----------------
     * ------------------------------------------
     */
    React.useEffect(() => setPost(props.post ?? {}), [props.post]);

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
        if (!reportValidity()) {
            return;
        }
        try {
            submit();
        } catch (error) {
            Toast.showToast({
                variant: 'error',
                title: 'Error',
                message: 'Failed to save post'
            });
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
        const service = new AppService();
        service.setCSRFToken(window.AppData.tokens.csrfToken);
        const promise = post.Id ? service.post('/posts', post) : service.patch(`/posts/${post.Id}`, post);
        const response = await promise;
        let responseBody;
        try {
            responseBody = await response.json();
        } catch (error) {
            throw new Error(await response.text());
        }
        console.log(responseBody);
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
            <div className='row'>
                <div className='col-9'>
                    <Input
                        ref={inputRefs.Slug}
                        type='text'
                        id='slug'
                        name='slug'
                        label='Slug'
                        value={post.Slug}
                        minLength={2}
                        maxLength={64}
                        required
                        onChange={handleChange}
                    />
                </div>
            </div>
            <div className='row'>
                <div className='col'>
                    <Wysiwyg id='body' name='body' onChange={handleChange} />
                </div>
            </div>
        </div>
    );
}
