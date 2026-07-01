import IBaseModel from '@models/base';

export default interface IUser extends IBaseModel {
    FirstName?: string;
    LastName?: string;
    Email?: string;
    Phone?: string;
    Password?: string;
    EmailVerified?: boolean;
    IsActive?: boolean;
    ActivatedDate?: Date;
}
