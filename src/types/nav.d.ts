declare module 'nav-types' {
    export interface NavNode {
        id: string;
        name: string;
        label: string;
        description: string;
        icon: string;
        path: string;
        type: 'd' | 'f';
    }

    export interface DirectoryNode extends NavNode {
        nodes: Array<NavNode>;
    }

    export interface FileNode extends NavNode {
        content?: string;
        encoding?: string;
    }
}
