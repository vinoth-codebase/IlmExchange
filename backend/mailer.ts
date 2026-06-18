import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { AuthCodeType } from './database';

dotenv.config();

const ADMIN_SMTP_EMAIL = process.env.SMTP_USER || 'vinothofficial14@gmail.com';
const SMTP_APP_PASSWORD = process.env.SMTP_APP_PASSWORD || '';

export interface MailDispatchResult {
  deliveredViaSmtp: boolean;
  previewMessage: string;
}

export async function sendAuthCodeEmail(
  recipientEmail: string,
  code: string,
  codeType: AuthCodeType = 'REGISTER'
): Promise<MailDispatchResult> {
  const heading =
    codeType === 'RESET'
      ? 'IlmExchange Password Reset Code'
      : 'IlmExchange Account Verification Code';
  const instruction =
    codeType === 'RESET'
      ? `Use the 6-digit security code below to reset the password for your IlmExchange account (${recipientEmail}):`
      : `Use the 6-digit verification code below to activate your IlmExchange campus account (${recipientEmail}):`;

  const htmlBody = `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; background-color: #F8FAFC; padding: 32px; color: #0F172A;">
      <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #003a63; color: #FFFFFF; padding: 20px 24px;">
          <div style="font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">TU Ilmenau Peer Marketplace</div>
          <div style="font-size: 20px; font-weight: 700; margin-top: 4px;">${heading}</div>
        </div>
        <div style="padding: 24px;">
          <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #334155;">
            ${instruction}
          </p>
          <div style="background-color: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 6px; padding: 16px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 28px; font-weight: 700; letter-spacing: 0.22em; color: #003a63;">
            ${code}
          </div>
          <p style="margin: 16px 0 0; font-size: 12px; color: #64748B;">
            This code expires in 15 minutes. Code Type: ${codeType}.
          </p>
        </div>
      </div>
    </div>
  `;

  if (SMTP_APP_PASSWORD && SMTP_APP_PASSWORD !== 'your_16_char_gmail_app_password') {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: ADMIN_SMTP_EMAIL,
          pass: SMTP_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"IlmExchange TU Ilmenau" <${ADMIN_SMTP_EMAIL}>`,
        to: recipientEmail,
        subject: `[IlmExchange] ${heading}: ${code}`,
        text: `${heading}: ${code}. This code expires in 15 minutes.`,
        html: htmlBody,
      });

      console.log(`[Mailer] Dispatched ${codeType} code via Gmail SMTP to ${recipientEmail}`);
      return {
        deliveredViaSmtp: true,
        previewMessage: `6-digit ${codeType} code dispatched via Gmail SMTP to ${recipientEmail}.`,
      };
    } catch (error) {
      console.warn(`[Mailer] SMTP dispatch failed, falling back to local console log for ${recipientEmail}:`, error);
    }
  }

  console.log(`[Mailer] Local development ${codeType} code for ${recipientEmail}: ${code}`);
  return {
    deliveredViaSmtp: false,
    previewMessage: `Local verification mode active. Use 6-digit ${codeType} code: ${code}`,
  };
}
