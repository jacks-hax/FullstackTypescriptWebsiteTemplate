import * as React from 'react';

// Models & Types
import IPost from '@models/post';

// Components
import PostForm, { PostFormHandle } from '@client/components/forms/posts-form';
import Modal, { ModalContent, ModalFooter, ModalHandle } from '@client/components/modal';
import toast from '@client/components/toast';
import Button from '@client/components/input/button';

export interface PostsScreenProps {
    posts: Array<IPost>;
}

export default function PostsScreen(props: PostsScreenProps) {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */
    //const [showSpinner, setShowSpinner] = React.useState<boolean>(false);
    const [posts, setPosts] = React.useState<Array<IPost>>(props.posts);

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */
    const modalRef = React.useRef<ModalHandle>(null);
    const postFormRef = React.useRef<PostFormHandle>(null);

    /**
     * ------------------------------------------
     * ---------------- EFFECTS -----------------
     * ------------------------------------------
     */
    React.useEffect(() => setPosts(props.posts), [props.posts]);

    /**
     * ------------------------------------------
     * ------------- EVENT HANDLERS  ------------
     * ------------------------------------------
     */
    const handleClickNewPost = () => {
        modalRef.current?.show();
    };

    const handleClickSaveNewPost = async () => {
        try {
            const newPost = await postFormRef.current?.save();
            if (!newPost) {
                throw new Error('Unable to save post form');
            }
            window.open(`${window.location.origin}/posts/${newPost.Id}`);
        } catch (error) {
            console.error(error);
            toast.showToast({
                variant: 'error',
                title: 'Error Creating Post',
                message: error instanceof Error ? error.message : 'Failed to create new post'
            });
        }
    };

    /**
     * ------------------------------------------
     * ---------------- HELPERS  ----------------
     * ------------------------------------------
     */
    const getPostPermalink = (post: IPost) => {
        return `${window.location.origin}/posts/${post.Id}`;
    };

    /**
     * ------------------------------------------
     * -------------- RENDERING -----------------
     * ------------------------------------------
     */

    const renderPosts = () => {
        if (!posts.length) {
            return (
                <div className='row'>
                    <p className='text-center py-3'>No posts yet.</p>
                </div>
            );
        }
        return posts.map((post) => (
            <div className='row'>
                <div className='col'>
                    <a href={getPostPermalink(post)}>{post.Title}</a>
                </div>
                <div className='col'>{post.Slug}</div>
                <div className='col'>{post.Status}</div>
                <div className='col'>{post.Author?.Email ?? post.AuthorId}</div>
                <div className='col'>{post.CreatedTimestamp}</div>
                <div className='col'>{post.LastModifiedTimestamp}</div>
            </div>
        ));
    };

    return (
        <>
            <div className='container'>
                <div className='row my-3'>
                    <div className='col'>
                        <button className='btn btn-primary float-right' onClick={handleClickNewPost}>
                            New Post
                        </button>
                    </div>
                </div>
                <div className='container'>
                    <div className='row bg-secondary text-light'>
                        <div className='col'>Title</div>
                        <div className='col'>Slug</div>
                        <div className='col'>Status</div>
                        <div className='col'>Audivor</div>
                        <div className='col'>Created Date</div>
                        <div className='col'>Last Modified Date</div>
                    </div>
                    {renderPosts()}
                </div>
            </div>
            <Modal ref={modalRef} id='new_post' title='New Post'>
                <ModalContent>
                    <PostForm ref={postFormRef}></PostForm>
                </ModalContent>
                <ModalFooter>
                    <Button id='save_post' name='save_post' label='Save' onClick={handleClickSaveNewPost} />
                </ModalFooter>
            </Modal>
        </>
    );
}
