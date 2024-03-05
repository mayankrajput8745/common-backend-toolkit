import twillo from 'twilio';

type TwilloClient = ReturnType<typeof twillo>;

export class TwilloSMSWrapper {

    protected _client?: TwilloClient;

    constructor(private accountSid: string, private authToken: string, private twilioPhoneNumber: string) { }

    async connect() {
        return new Promise<void>((resolve, reject) => {
            try {
                this._client = twillo(this.accountSid, this.authToken);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    sendSMS(to: string, body: string) {
        if (!this._client) {
            throw new Error('SMS Provider is not connected');
        }

        return this._client.messages.create({
            body,
            to,
            from: this.twilioPhoneNumber
        })
    };
}
