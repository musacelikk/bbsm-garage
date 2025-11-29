import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    // Transporter'ı lazy initialization ile oluştur
    // Böylece .env dosyası yüklenmeden hata vermez
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const smtpHost = this.configService.get<string>('SMTP_HOST');
      const smtpPort = this.configService.get<string>('SMTP_PORT');
      const smtpUser = this.configService.get<string>('SMTP_USER');
      const smtpPass = this.configService.get<string>('SMTP_PASS');

      if (!smtpHost || !smtpUser || !smtpPass) {
        this.logger.warn('SMTP ayarları eksik! Email gönderilemeyecek.');
        throw new Error('SMTP ayarları eksik. Lütfen .env dosyasını kontrol edin.');
      }

      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: this.configService.get<string>('SMTP_SECURE') === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }
    return this.transporter;
  }

  async sendVerificationEmail(email: string, token: string, username: string): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: this.configService.get<string>('SMTP_FROM') || this.configService.get<string>('SMTP_USER'),
      to: email,
      subject: 'BBSM Garage - Email Doğrulama',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BBSM Garage</h1>
            </div>
            <div class="content">
              <h2>Email Doğrulama</h2>
              <p>Merhaba <strong>${username}</strong>,</p>
              <p>BBSM Garage'a hoş geldiniz! Hesabınızı aktifleştirmek için aşağıdaki butona tıklayın:</p>
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Email'i Doğrula</a>
              </div>
              <p>Veya aşağıdaki linki tarayıcınıza yapıştırabilirsiniz:</p>
              <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
              <p><strong>Not:</strong> Bu link 24 saat geçerlidir.</p>
            </div>
            <div class="footer">
              <p>Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}:`, error);
      // Email gönderme hatası kaydı engellemez, sadece log'a yazılır
      throw new Error('Email gönderilemedi');
    }
  }
}

