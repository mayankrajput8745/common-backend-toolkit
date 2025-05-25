import nodemailer, { Transporter } from 'nodemailer';

export class GmailEmailWrapper {
    private _username?: string;
    private _password?: string;
    private _transporter?: Transporter;

    async connect(username: string, password: string): Promise<void> {
        return new Promise<void>(async (resolve, reject) => {
            try {
                this._username = username;
                this._password = password;

                this._transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: this._username,
                        pass: this._password,
                    },
                });

                // Optional: Verify connection
                await this._transporter.verify();
                resolve();
            } catch (error) {
                reject(error);
            }
        })
    }

    async sendEmail(to: string, subject: string, text?: string, html?: string): Promise<void> {
        if (!this._transporter || !this._username) {
            throw new Error('Email transporter not initialized. Call connect() first.');
        }

        const mailOptions = {
            from: this._username,
            to,
            subject,
            text,
            html,
        };

        await this._transporter.sendMail(mailOptions);
        return;
    }

    async disconnect() {

    }
}
