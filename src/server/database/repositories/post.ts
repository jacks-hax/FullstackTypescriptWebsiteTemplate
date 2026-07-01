import { DatabaseError, RequestError } from '@database/models/errors';
import Database from '@database/database';
import Constants from '@constants/shared';
import Post from '@database/models/post';
import StringUtils from '@utils/string';
import Utils from '@utils/utils';

export default class PoseRepository {
    /**
     * @description Get a post record by Id
     * @param id Post Id
     * @returns Post object
     */
    public static async getPost(id: string): Promise<Post | null> {
        const fields = Post.getDescribe()
            .fields.map((field) => field.name)
            .join(',');
        const postRecords = await Database.query(`SELECT ${fields} FROM Post WHERE Id = ? LIMIT 1;`, [id]);
        if (!postRecords.length) {
            return null;
        }
        console.log('Post Record:', postRecords);
        const post = Post.from(postRecords[0]);
        return post;
    }

    public static async listPosts(): Promise<Array<Post>> {
        const fields = Post.getDescribe()
            .fields.map((field) => field.name)
            .join(',');
        const postRecords = await Database.query(`SELECT ${fields} FROM Post;`);
        const postModels = postRecords.map((record) => Post.from(record));
        return postModels;
    }

    /**
     * @description Create a new post record
     * @param post Post object to create
     * @returns The created post object with a unique Id
     */
    public static async createPost(post: Post): Promise<string> {
        console.log('Creating Post:', post);
        const createbleFields = Post.getDescribe().fields.filter((field) => !Post.READONLY_FIELDS.has(field.name));

        // Validate regular fields first, then password last
        Utils.validateFields(post, createbleFields);

        try {
            // Insert the user record and return the record with it's new id
            return await Database.wrap(async () => {
                console.log('Post before', post);
                await Database.insert(post);
                console.log('Post after', post);
                return post;
            });
        } catch (error) {
            if (error instanceof DatabaseError) {
                // Override default MySQL error messages with more user-friendly custom error messages
                switch (error.code) {
                    case Constants.MYSQL_ERROR_CODES.ER_DUP_ENTRY:
                        error.message = 'Post with this slug already exists';
                    default:
                        break;
                }
            }
            throw error;
        }
    }

    /**
     * @description Update a post record
     * @param post Post record to update. Must include Id field. Cannot include fields that are not updateable.
     * @returns The updated post record
     */
    public static async updatePost(post: Post): Promise<Post> {
        const fields = Post.getDescribe().fields.filter((field) => !Post.READONLY_FIELDS.has(field.name));
        Utils.validateFields(post, fields);

        const result = await Database.update(post);
        if (result.affectedRows === 0) {
            const errorMessage = StringUtils.format(Constants.ERROR_MESSAGES.RECORD_NOT_FOUND, [
                'post',
                'id',
                post.Id ?? ''
            ]);
            throw new RequestError(Constants.ERROR_CODES.NOT_FOUND, errorMessage);
        }
        return post;
    }

    public static async deletePost(postId: string): Promise<Post> {
        const post = new Post();
        post.Id = postId;
        const result = await Database.delete(post);
        console.log('DELETE RESULT:', result);
        return post;
    }
}
