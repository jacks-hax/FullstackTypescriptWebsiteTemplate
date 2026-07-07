declare module 'node:http' {
    export interface ServerResponse {
        cspNonce?: string;
    }
}
