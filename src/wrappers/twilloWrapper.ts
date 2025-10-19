import { Twilio } from 'twilio';

interface TwilioCallOptions {
    statusCallback?: string;
    statusCallbackMethod?: 'GET' | 'POST';
    record?: boolean;
    timeout?: number;
    machineDetection?: 'Enable' | 'DetectMessageEnd';
    [key: string]: any;
}

interface UserTwilioConfig {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
}

class TwilioWrapperInstance {
    public client: Twilio;
    public phoneNumber: string;

    constructor(config: UserTwilioConfig) {
        this.client = new Twilio(config.accountSid, config.authToken);
        this.phoneNumber = config.phoneNumber;
    }

    async getBalance(): Promise<number> {
        const balance = await this.client.balance.fetch();
        return Math.round(Number(balance.balance) * 100) / 100;
    }

    async ensureSufficientBalance(minBalance: number = 10) {
        const balance = await this.getBalance();
        if (balance < minBalance) {
            throw new Error(`Insufficient Twilio balance: ${balance}. Minimum required is $${minBalance}.`);
        }
    }

    async sendSMS(to: string, body: string, minBalance: number = 10) {
        await this.ensureSufficientBalance(minBalance);
        return this.client.messages.create({ body, from: this.phoneNumber, to });
    }

    async makeOutboundCall(to: string, twimlUrl: string, options?: TwilioCallOptions, minBalance: number = 10) {
        await this.ensureSufficientBalance(minBalance);
        return this.client.calls.create({ url: twimlUrl, to, from: this.phoneNumber, ...options });
    }
}

export class TwilioWrapper {
    // Default Twilio client
    private _defaultClient?: Twilio;
    private _defaultPhoneNumber?: string;

    // Map of per-tenant clients
    private _userClients: Map<string, TwilioWrapperInstance> = new Map();

    // ---------------- Default Client Methods ----------------
    connectDefault(accountSid: string, authToken: string, phoneNumber: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                this._defaultClient = new Twilio(accountSid, authToken);
                this._defaultPhoneNumber = phoneNumber;
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    private async getDefaultBalance(): Promise<number> {
        if (!this._defaultClient) throw new Error('Default Twilio client not initialized.');
        const balance = await this._defaultClient.balance.fetch();
        return Math.round(Number(balance.balance) * 100) / 100;
    }

    private async ensureDefaultBalance(minBalance: number = 10) {
        const balance = await this.getDefaultBalance();
        if (balance < minBalance) {
            throw new Error(`Insufficient default Twilio balance: ${balance}. Minimum required is $${minBalance}.`);
        }
    }

    async sendDefaultSMS(to: string, body: string, minBalance: number = 10) {
        if (!this._defaultClient || !this._defaultPhoneNumber) throw new Error('Default Twilio client not initialized.');
        await this.ensureDefaultBalance(minBalance);
        return this._defaultClient.messages.create({ body, from: this._defaultPhoneNumber, to });
    }

    async makeDefaultCall(to: string, twimlUrl: string, options?: TwilioCallOptions, minBalance: number = 10) {
        if (!this._defaultClient || !this._defaultPhoneNumber) throw new Error('Default Twilio client not initialized.');
        await this.ensureDefaultBalance(minBalance);
        return this._defaultClient.calls.create({ url: twimlUrl, to, from: this._defaultPhoneNumber, ...options });
    }

    // ---------------- Per-User Client Methods ----------------
    connectUser(userId: string, config: UserTwilioConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const wrapper = new TwilioWrapperInstance(config);
                this._userClients.set(userId, wrapper);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    async sendUserSMS(userId: string, to: string, body: string) {
        const wrapper = this._userClients.get(userId);
        if (!wrapper) throw new Error(`User Twilio client not found for userId: ${userId}`);
        return wrapper.sendSMS(to, body);
    }

    async makeUserCall(userId: string, to: string, twimlUrl: string, options?: TwilioCallOptions) {
        const wrapper = this._userClients.get(userId);
        if (!wrapper) throw new Error(`User Twilio client not found for userId: ${userId}`);
        return wrapper.makeOutboundCall(to, twimlUrl, options);
    }

    async getUserBalance(userId: string): Promise<number> {
        const wrapper = this._userClients.get(userId);
        if (!wrapper) throw new Error(`User Twilio client not found for userId: ${userId}`);
        return wrapper.getBalance();
    }

    async getDefaultClientBalance(): Promise<number> {
        return this.getDefaultBalance();
    }

    disconnectUser(userId: string) {
        this._userClients.delete(userId);
    }

    disconnectDefault() {
        this._defaultClient = undefined;
        this._defaultPhoneNumber = undefined;
    }
}
