import nodemailer, { Transporter } from 'nodemailer';
import { ENV } from '../config/env';

interface SendMailParams {
  from: string;
  to: string;
  subject: string;
  body: string;
}

interface SendMailResult {
  messageId: string;
  etherealPreviewUrl: string | null;
}

class EmailService {
  private transporter: Transporter | null = null;
  private testAccount: { user: string; pass: string } | null = null;
  private isInitializing = false;

  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) return this.transporter;

    if (ENV.ETHEREAL_USER && ENV.ETHEREAL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: ENV.ETHEREAL_USER,
          pass: ENV.ETHEREAL_PASS,
        },
      });
      console.log(`✉️ Configured Ethereal SMTP with user: ${ENV.ETHEREAL_USER}`);
      return this.transporter;
    }

    if (!this.testAccount) {
      console.log('🔄 Creating new Ethereal Email test account...');
      const account = await nodemailer.createTestAccount();
      this.testAccount = {
        user: account.user,
        pass: account.pass,
      };
      console.log(`✅ Created Ethereal Test Account: ${account.user}`);
    }

    this.transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: this.testAccount.user,
        pass: this.testAccount.pass,
      },
    });

    return this.transporter;
  }

  public async sendEmail({ from, to, subject, body }: SendMailParams): Promise<SendMailResult> {
    const transporter = await this.getTransporter();

    // Support both plain text and basic HTML rendering
    const info = await transporter.sendMail({
      from: `"${from.split('@')[0]}" <${from}>`,
      to,
      subject,
      text: body,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">${subject}</h2>
          <div style="font-size: 15px; line-height: 1.6; white-space: pre-wrap; margin-top: 16px;">${body}</div>
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
            Sent via <strong>ReachInbox Email Scheduler</strong> test worker (Ethereal SMTP).
          </div>
        </div>
      `,
    });

    const etherealPreviewUrl = nodemailer.getTestMessageUrl(info) || null;
    return {
      messageId: info.messageId,
      etherealPreviewUrl: etherealPreviewUrl ? String(etherealPreviewUrl) : null,
    };
  }
}

export const emailService = new EmailService();
