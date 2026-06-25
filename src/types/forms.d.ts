declare module 'form-types' {
    export interface FormTokens {
        csrfToken: string;
    }

    export interface LoginForm {
        username: string;
        password: string;
    }
}
