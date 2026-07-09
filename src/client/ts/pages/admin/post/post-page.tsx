import * as React from 'react';
import PostForm, { PostFormProps } from '@client/components/forms/posts-form';
import Button from '@client/components/input/button';

export interface PostPageProps extends PostFormProps {}

export default function PostPage(props: PostPageProps) {
    const handleClickSave = () => {};

    return (
        <div className='container'>
            <div className='row'>
                <PostForm post={props.post} />
            </div>
            <div className='row'>
                <Button id='save_post' name='save_post' label='Save' onClick={handleClickSave} />
            </div>
        </div>
    );
}
