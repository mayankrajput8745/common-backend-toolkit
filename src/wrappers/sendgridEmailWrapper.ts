import * as sgMail from '@sendgrid/mail';

type SendGridClient = typeof sgMail;

export class sendGridEmailWrapper {
    private _client?: SendGridClient;

    constructor(private apiKey: string) { }

    async connect() {
        return new Promise<void>((resolve, reject) => {
            try {
                sgMail.setApiKey(this.apiKey);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    sendEmail(to: string, from: string, subject: string, text: string, html: string) {
        if (!this._client) {
            throw new Error('Email Provider is not connected');
        }

        return this._client.send({
            to,
            from,
            subject,
            text,
            html
        });
    };
}