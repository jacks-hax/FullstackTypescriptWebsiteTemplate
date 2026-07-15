import INavNode from './nav';

export interface ISiteIndex {
    /**
     * TODO:
     * - Figure this data struct out
     * - Add logic to backend to generate sitemap based on file structure of react pages
     * - Update app.tsx to check sitemap before attempting to fetch file
     *   > What to do if path is not found in sitemap?
     * - Update static files handler backend to check cached sitemap (maybe use same data strutct here?)
     */
}

export interface IHeader {
    menuItems: Array<INavNode>;
    logoUrl: string;
}

export interface IFooter {
    menuItems: Array<INavNode>;
}

export interface IServerInfo {
    baseUrl: string;
    siteIndex: ISiteIndex;
}

export interface IAppTokens {
    csrfToken: string;
}

export interface IAppData extends Record<string, any> {
    header: IHeader;
    footer: IFooter;
    tokens: IAppTokens;
    serverInfo: IServerInfo;
}

export default interface AppWindow extends Window {
    AppData: IAppData;
}
