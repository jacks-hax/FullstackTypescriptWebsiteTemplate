declare module 'header-types' {
    import { NavNode } from 'nav-types';
    export interface Header {
        menuItems: Array<NavNode>;
        urls: Record<string, string>;
        logoUrl: string;
    }

    export interface NavMenuHandle {}
}
