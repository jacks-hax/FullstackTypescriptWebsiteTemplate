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
    return (
        <table>
            <thead>
                <tr>
                    <th scope='col'>Title</th>
                    <th scope='col'>Slug</th>
                    <th scope='col'>Status</th>
                    <th scope='col'>Author</th>
                    <th scope='col'>Created Date</th>
                    <th scope='col'>Last Modified Date</th>
                </tr>
            </thead>
            <tbody>
                {posts.map((post) => (
                    <tr>
                        <th scope='row'>
                            <a href={getPostPermalink(post)}>{post.Title}</a>
                        </th>
                        <td>{post.Slug}</td>
                        <td>{post.Status}</td>
                        <td>{post.Author?.Email ?? post.AuthorId}</td>
                        <td>{post.CreatedTimestamp}</td>
                        <td>{post.LastModifiedTimestamp}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
