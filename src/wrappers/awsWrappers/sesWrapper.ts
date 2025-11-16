import nodemailer, { SendMailOptions, Transporter } from "nodemailer";
import { SESv2Client, SendEmailCommand, SESv2ClientConfig } from "@aws-sdk/client-sesv2";

export class SESWrapper {
  private transporter?: Transporter;

  async connect(sesConfig: SESv2ClientConfig) {
    const sesClient = new SESv2Client(sesConfig);

    this.transporter = nodemailer.createTransport({
      SES: { sesClient, SendEmailCommand }
    });

    await this.transporter.verify();
  }

  disconnect(): void {
    if (!this.transporter) {
      throw new Error("Cannot access SES client before connecting");
    }
    this.transporter.close();
  }

  async sendMail(mailOptions: SendMailOptions): Promise<void> {
    if (!this.transporter) {
      throw new Error("Cannot access SES client before connecting");
    }
    await this.transporter.sendMail(mailOptions);
  }
}
