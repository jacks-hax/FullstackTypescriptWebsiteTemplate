export default class Constants {
    public static readonly PASSWORD_TTL = 1000 * 60 * 60 * 24 * 365;

    public static readonly CREDENTIAL_TYPE = class {
        public static readonly PASSWORD = 'password';
        public static readonly MFA_SECRET = 'mfa_secret';
        public static readonly JWT = 'jwt';
    };

    public static readonly MENU_ITEM_LOCATION = class {
        public static readonly HEADER = 'header';
        public static readonly FOOTER = 'footer';
    };
}
