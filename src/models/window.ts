import INavNode from './nav';

export interface IHeader {
    menuItems: Array<INavNode>;
    logoUrl: string;
}

export interface IFooter {
    menuItems: Array<INavNode>;
}

export interface IAppData extends Record<string, any> {
    header: IHeader;
    footer: IFooter;
}

export default interface AppWindow extends Window {
    AppData: IAppData;
}
