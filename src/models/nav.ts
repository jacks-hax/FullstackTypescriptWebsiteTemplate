import IBaseModel from '@models/base';

export default interface INavNode extends IBaseModel {
    Title?: string;
    Description?: string;
    Icon?: string;
    Url?: string;
    ParentId: string;
    Children?: Array<INavNode>;
}
