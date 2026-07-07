import * as React from 'react';

import Post from '@models/post';

export interface PostsScreenProps {
    posts: Array<Post>;
}
export default function PostsScreen(props: PostsScreenProps) {
    /**
     * ------------------------------------------
     * ---------------- STATE -------------------
     * ------------------------------------------
     */
    //const [showSpinner, setShowSpinner] = React.useState<boolean>(false);
    const [posts, setPosts] = React.useState<Array<Post>>(props.posts);

    /**
     * ------------------------------------------
     * ----------------- REFS -------------------
     * ------------------------------------------
     */

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
    const handleClickNewPost = (_: React.MouseEvent<HTMLButtonElement>) => {
        window.location.href = '/admin/posts';
    };

    /**
     * ------------------------------------------
     * ---------------- HELPERS  ----------------
     * ------------------------------------------
     */
    const getPostPermalink = (post: Post) => {
        return `${window.location.origin}/admin/posts/${post.Slug}`;
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
    );
}
