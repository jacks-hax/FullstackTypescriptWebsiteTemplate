declare module 'wysi' {
    export interface WysiConfig {
        el: string;
        darkMode?: boolean;
        height?: number;
        autoGrow?: boolean;
        autoHide?: boolean;
        onChange?: (content: string) => void;
    }
    export type WysiInit = (config: WysiConfig) => void;
}
