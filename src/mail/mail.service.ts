import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    // Note: In a production app, it's better to inject Nest's ConfigService
    // to access your environment variables safely.
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    // Build the URL that points to your frontend reset page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Your App <noreply@yourdomain.com>', // MUST be a verified domain in Resend
        to,
        subject: 'Password Reset Request',
        html: `
          <h2>Reset Your Password</h2>
          <p>You recently requested to reset your password. Click the link below to securely change it.</p>
          <p><a href="${resetLink}"><strong>Reset Password</strong></a></p>
          <p><em>This link will expire in 15 minutes.</em></p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });

      if (error) {
        this.logger.error(`Failed to send email to ${to}`, error);
        return null;
      }

      this.logger.log(`Password reset email sent to ${to} (ID: ${data?.id})`);
      return data;
    } catch (err) {
      this.logger.error('Unexpected error sending email with Resend', err);
      // We don't throw the error back to the user to prevent email enumeration,
      // but we log it internally for debugging.
    }
  }
}
