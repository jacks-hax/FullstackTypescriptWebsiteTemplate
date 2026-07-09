declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NODE_ENV: 'development' | 'staging' | 'production';
            GATEWAY: 'admin' | 'public';
            GATEWAY_PATH: string;
            SERVER_PROTOCOL: 'http' | 'https';
            SERVER_HOST_NAME: string;
            SERVER_PORT: string;
            MYSQL_HOST: string;
            MYSQL_DATABASE: string;
            MYSQL_USER: string;
            MYSQL_PASSWORD: string;
            LOG_FILE_PATH: string;
            JWT_PRIVATE_KEY_FILE: string;
            JWT_PUBLIC_KEY_FILE: string;
            SESSION_SECRET: string;
        }
    }
}

// Including an export forces the linter to consider this file as an ES module
// so we get type enforcement across the rest of the codebase
export {};
