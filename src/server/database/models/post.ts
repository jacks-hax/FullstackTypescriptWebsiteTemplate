/**
 * Post data model representation
 */
import BaseModel, { IBaseModel } from '@database/models/base';

export interface IPost extends IBaseModel {
    Status?: string;
    Title?: string;
    Slug?: string;
    AuthorId?: string;
    Body?: string;
}

export default class Post extends BaseModel implements IPost {
    public Status?: string;
    public Title?: string;
    public Slug?: string;
    public AuthorId?: string;
    public Body?: string;

    protected static readonly ID_PREFIX: string = 'post';
    protected getIdPrefix(): string {
        return Post.ID_PREFIX;
    }

    /**
     * @description Parse a data object into a user instance
     * @param data The raw untyped user data. Either from a request payload or database query
     */
    public static from(data: IPost): Post {
        return super.from(data) as Post;
    }
}
