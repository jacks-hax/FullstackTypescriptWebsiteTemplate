import { Request } from 'express';

export default class StringUtils {
    public static format(formatString: string, variables: Array<string>): string {
        return formatString.replace(/{(\d+)}/g, function (match, index) {
            if (typeof index !== 'number') {
                index = parseInt(index);
            }
            return typeof variables[index] != 'undefined' ? variables[index] : match;
        });
    }

    public static merge(formatString: string, data: Record<string, string>): string {
        Object.keys(data).forEach((key) => {
            formatString = formatString.replaceAll(`{{!${key}}}`, data[key]);
        });
        return formatString;
    }

    public static toTitle(str: string): string {
        return str
            .replaceAll(/[^a-zA-Z0-9\+_-]/g, '')
            .replaceAll(/(\+|-)/g, '_')
            .split('_')
            .map((word) => word.toLowerCase().replace(/^(.)/, word.charAt(0).toUpperCase()))
            .join(' ');
    }

    public static escapeSingleQuotes(str: string): string {
        return str.replace(/'/g, "\\'");
    }

    public static getRequestParameter(request: Request, param: string): string {
        let value = request.params[param];
        return Array.isArray(value) ? value[0] : value;
    }
}
