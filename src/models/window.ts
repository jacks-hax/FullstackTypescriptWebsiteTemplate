import INavNode from './nav';

export interface IHeader {
    menuItems: Array<INavNode>;
    logoUrl: string;
}

export interface IFooter {
    menuItems: Array<INavNode>;
}

export interface IAppData {
    header: IHeader;
    footer: IFooter;
}

export default interface AppWindow extends Window {
    AppData: IAppData;
}
