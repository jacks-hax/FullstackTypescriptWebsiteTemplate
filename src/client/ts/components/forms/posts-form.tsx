import * as React from 'react';

// Services & Utilities
import AppService from '@client/services/app-service';

// Components
import { AbstractInputHandle, HTMLAbstractInputElement } from '@client/components/input/peripherals';
import Wysiwyg from '@client/components/input/wysiwyg';
import Input from '@client/components/input/input';
import Spinner from '@client/components/spinner';

// Models & Types
import * as InternalEvents from '@client/events';
import AppWindow from '@models/window';
import IPost from '@models/post';

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
    //const [isValid, setIsValid] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */
    const postRef = React.useRef<IPost>(props.post ?? {});
    const inputRefs: { [key in keyof IPost]: React.RefObject<AbstractInputHandle | null> } = {
        Title: React.useRef<AbstractInputHandle>(null),
        Slug: React.useRef<AbstractInputHandle>(null),
        //Status: React.useRef<AbstractInputHandle>(null),
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
        console.log('change event', param, value, postRef.current);
        postRef.current[param as keyof IPost] = value;
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
        //setIsValid(valid);
        return valid;
    };

    const reportValidity = (): boolean => {
        let valid = true;
        Object.values(inputRefs).forEach((input) => {
            if (!input.current?.reportValidity()) {
                valid = false;
            }
        });
        //setIsValid(valid);
        return valid;
    };

    const save = async (): Promise<IPost> => {
        if (!reportValidity()) {
            throw new Error('Invalid form');
        }
        setIsLoading(true);
        try {
            const service = new AppService();
            await service.applyCSRFToken();
            const post = postRef.current;
            let promise: Promise<Response>;
            if (post.Id) {
                promise = service.patch(`/posts/${post.Id}`, post);
            } else {
                promise = service.post('/posts', post);
            }
            const response = await promise;
            console.log(response);
            const payload = await AppService.handle(response);
            if (payload.data) {
                const responsePost = payload.data as IPost;
                postRef.current = responsePost;
                return responsePost;
            }
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
        return postRef.current;
    };

    /**
     * ------------------------------------------
     * ---------------- EFFECTS -----------------
     * ------------------------------------------
     */

    React.useImperativeHandle(ref, () => ({
        save
    }));

    React.useEffect(() => {
        console.log('setting post from effect:', props.post);
        postRef.current = props.post ?? {};
    }, [props.post]);

    /**
     * ------------------------------------------
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */

    return (
        <div className='container'>
            {isLoading && <Spinner />}
            <div className='row mb-3'>
                <div className='col'>
                    <Input
                        ref={inputRefs.Title}
                        type='text'
                        id='Title'
                        name='Title'
                        label='Title'
                        value={postRef.current.Title}
                        minLength={2}
                        maxLength={64}
                        required
                        onChange={handleChange}
                    />
                </div>
            </div>
            <div className='row mb-3'>
                <div className='col'>
                    <Input
                        ref={inputRefs.Slug}
                        type='text'
                        id='Slug'
                        name='Slug'
                        label='Slug'
                        pattern='^[a-z0-9]+((-[a-z0-9]+)+)?$'
                        messageWhenBadInput='Post slug must be in kebab-case-like-this'
                        value={postRef.current.Slug}
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
                        id='Body'
                        name='Body'
                        label='Html Body'
                        value={postRef.current.Body}
                        minLength={2}
                        maxLength={32768}
                        required
                        onChange={handleChange}
                    />
                </div>
            </div>
        </div>
    );
}

export default React.forwardRef(PostForm);
