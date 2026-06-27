declare module 'header-types' {
    import { NavNode } from 'nav-types';
    export interface Header {
        menuItems: Array<NavNode>;
        logoUrl: string;
    }

    export interface NavMenuHandle {}
}
