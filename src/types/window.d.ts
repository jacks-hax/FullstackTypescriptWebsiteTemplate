declare module 'window-types' {
    import { Header } from 'header-types';

    export interface AppData {
        header: Header;
    }

    export default interface AppWindow extends Window {
        AppData: AppData;
    }
}
