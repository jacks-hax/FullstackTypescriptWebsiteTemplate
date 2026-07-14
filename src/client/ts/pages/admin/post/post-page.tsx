import * as React from 'react';
import PostForm, { PostFormHandle, PostFormProps } from '@client/components/forms/posts-form';
import Button from '@client/components/input/button';
import Toast from '@client/components/toast';
import Constants from '@constants/client';

export interface PostPageProps extends PostFormProps {}

export default function PostPage(props: PostPageProps) {
    const postFormRef = React.useRef<PostFormHandle>(null);
    const handleClickSave = () => {
        if (postFormRef.current) {
            postFormRef.current.save();
        } else {
            console.error('Post form handle not found!');
            Toast.showErrorToast(Constants.GENERIC_FORM_ERROR_MSG);
        }
    };

    return (
        <div className='container'>
            <div className='row'>
                <PostForm ref={postFormRef} post={props.post} />
            </div>
            <div className='row'>
                <Button id='save_post' name='save_post' label='Save' onClick={handleClickSave} />
            </div>
        </div>
    );
}
