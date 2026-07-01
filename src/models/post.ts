import IBaseModel from '@models/base';
import IUser from '@models/user';

export default interface IPost extends IBaseModel {
    Status?: string;
    Title?: string;
    Slug?: string;
    AuthorId?: string;
    Author?: IUser;
    Body?: string;
}
