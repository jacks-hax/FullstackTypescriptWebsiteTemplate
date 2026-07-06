import IBaseModel from '@models/base';

export default interface INavNode extends IBaseModel {
    Status?: string;
    Title?: string;
    Description?: string;
    Location?: string;
    IconUrl?: string;
    Url?: string;
    ParentId: string;
    Children?: Array<INavNode>;
}
