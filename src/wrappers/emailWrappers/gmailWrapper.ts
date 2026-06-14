import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

export class GmailEmailWrapper {
    private _username?: string | null = null;
    private _password?: string | null = null;
    private _transporter?: Transporter | null = null;

    async connect(username: string, password: string): Promise<void> {
        if (!username || !password) {
            throw new Error('Google mail username and password are required.');
        }

        this._username = username;
        this._password = password;
        this._transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: this._username,
                pass: this._password,
            },
        });

        await this._transporter.verify();
    }

    async sendEmail(
        mailOptionsOrTo: string | SendMailOptions,
        subject?: string,
        text?: string,
        html?: string
    ): Promise<void> {
        if (!this._transporter || !this._username) {
            throw new Error('Email transporter not initialized. Call connect() first.');
        }

        const mailOptions: SendMailOptions = typeof mailOptionsOrTo === 'object'
            ? mailOptionsOrTo
            : {
                to: mailOptionsOrTo,
                subject,
                text,
                html,
            };

        await this._transporter.sendMail({
            from: this._username,
            ...mailOptions,
        });
    }

    async sendMail(mailOptions: SendMailOptions): Promise<void> {
        return this.sendEmail(mailOptions);
    }

    async disconnect(): Promise<void> {
        if (this._transporter) {
            this._transporter.close();
            this._transporter = null;
        }

        this._username = null;
        this._password = null;
    }
}

export default GmailEmailWrapper;
