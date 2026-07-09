export default class HttpClient {
    public url: URL;
    public headers: { [key: string]: string };

    constructor(url: string | URL) {
        if (typeof url === 'string') {
            this.url = new URL(url);
        } else {
            this.url = url;
        }
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    public setHeader(key: string, value: string): void {
        this.headers[key] = value;
    }

    public setQueryParameter(key: string, value: any): void {
        if (value == null) {
            this.url.searchParams.delete(key);
        } else {
            this.url.searchParams.set(key, value.toString());
        }
    }

    public async get(endpoint: string): Promise<Response> {
        const url = new URL(this.url);
        url.pathname += endpoint;
        return await fetch(url, {
            credentials: 'same-origin',
            method: 'GET',
            headers: this.headers
        });
    }

    public async post(endpoint: string, data: object): Promise<Response> {
        const url = new URL(this.url);
        url.pathname += endpoint;
        return await fetch(url, {
            credentials: 'same-origin',
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(data)
        });
    }

    public async patch(endpoint: string, data: object): Promise<Response> {
        const url = new URL(this.url);
        url.pathname += endpoint;
        return await fetch(url, {
            credentials: 'same-origin',
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(data)
        });
    }

    public async delete(endpoint: string): Promise<Response> {
        const url = new URL(this.url);
        url.pathname += endpoint;
        return await fetch(url, {
            credentials: 'same-origin',
            method: 'DELETE',
            headers: this.headers
        });
    }
}
