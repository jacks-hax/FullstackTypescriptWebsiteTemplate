declare module 'window-types' {
    import { Header } from 'header-types';
    export default interface AppWindow extends Window {
        AppData: WindowData;
    }

    export interface WindowData {
        header: Header;
    }
}
