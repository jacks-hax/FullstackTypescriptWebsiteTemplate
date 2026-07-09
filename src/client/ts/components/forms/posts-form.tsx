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

import AppService from '@client/services/app-service';
import { ResponseError } from '@models/errors';
import JsonApiResponse from '@models/jsonapi';

declare const window: AppWindow;

export interface PostFormProps {
    post?: IPost;
}

export interface PostFormHandle {
    save: () => Promise<IPost>;
}

function PostForm(props: PostFormProps, ref: React.ForwardedRef<PostFormHandle>) {
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
        Status: React.useRef<AbstractInputHandle>(null),
        Body: React.useRef<AbstractInputHandle>(null)
    };

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

    const save = async (): Promise<IPost> => {
        if (!reportValidity()) {
            throw new Error('Invalid form');
        }
        setIsLoading(true);
        const service = new AppService();
        service.setCSRFToken(window.AppData.tokens.csrfToken);
        const promise = post.Id ? service.post('/posts', post) : service.patch(`/posts/${post.Id}`, post);
        const response = await promise;
        if (!response.ok) {
            throw new ResponseError('Failed to save post', response);
        }
        try {
            const payload = JsonApiResponse.from(await response.json());
            if (payload.data) {
                const responsePost = payload.data as IPost;
                setPost(responsePost);
                return responsePost;
            }
        } catch (error) {
            console.error(error);
            throw new ResponseError('Failed to process response from server', response);
        }
        return post;
    };

    /**
     * ------------------------------------------
     * ---------------- EFFECTS -----------------
     * ------------------------------------------
     */

    React.useImperativeHandle(ref, () => ({
        save
    }));

    React.useEffect(() => setPost(props.post ?? {}), [props.post]);

    /**
     * ------------------------------------------
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */

    return (
        <form className='container app-form'>
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
                    <Wysiwyg
                        ref={inputRefs.Body}
                        id='body'
                        name='body'
                        label='Html Body'
                        value={post.Body}
                        required
                        onChange={handleChange}
                    />
                </div>
            </div>
        </form>
    );
}

export default React.forwardRef(PostForm);
