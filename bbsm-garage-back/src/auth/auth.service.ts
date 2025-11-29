import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from './auth.entity';
import { AuthDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';
import { LogService } from '../log/log.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity) private databaseRepository: Repository<AuthEntity>,
    private readonly jwtService: JwtService,
    private readonly logService: LogService,
    private readonly emailService: EmailService
  ) {}

  findAll(): any {
    return this.databaseRepository.find();
  }

  async addOne(database: AuthDto): Promise<AuthEntity> {
    // Kullanıcı adı kontrolü
    const existingUser = await this.databaseRepository.findOne({
      where: { username: database.username }
    });
    
    if (existingUser) {
      throw new Error('Bu kullanıcı adı zaten kullanılıyor');
    }

    // Entity oluştur (BeforeInsert hook'u çalışsın)
    const newUser = this.databaseRepository.create({
      username: database.username,
      password: database.password,
      firmaAdi: database.firmaAdi || null,
      yetkiliKisi: database.yetkiliKisi || null,
      telefon: database.telefon || null,
      email: database.email || null,
      adres: database.adres || null,
      vergiNo: database.vergiNo || null
    });

    // Benzersiz tenant_id kontrolü
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const randomTenantId = Math.floor(10000000 + Math.random() * 90000000);
      const existingTenant = await this.databaseRepository.findOne({
        where: { tenant_id: randomTenantId }
      });
      
      if (!existingTenant) {
        newUser.tenant_id = randomTenantId;
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Tenant ID oluşturulamadı, lütfen tekrar deneyin');
    }

    // Email doğrulama token'ı oluştur
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24); // 24 saat geçerli

    newUser.verificationToken = verificationToken;
    newUser.verificationTokenExpiry = verificationTokenExpiry;
    newUser.emailVerified = false;

    const savedUser = await this.databaseRepository.save(newUser);

    // Email gönder (eğer email varsa)
    if (savedUser.email) {
      try {
        await this.emailService.sendVerificationEmail(
          savedUser.email,
          verificationToken,
          savedUser.username
        );
      } catch (error) {
        console.error('Email gönderme hatası:', error);
        // Email gönderme hatası kaydı engellemez
      }
    }

    return savedUser;
  }

  async findUserPass(database: AuthDto) {
    if (!database.username || !database.password) {
      return null;
    }
    const result = await this.databaseRepository.find({
      where: { 
        username: database.username, 
        password: database.password
      }
    });
  
    if (result.length > 0) {
      const user = result[0];
      
      const payload = { 
        username: user.username, 
        sub: user.id,
        tenant_id: user.tenant_id 
      };
      const token = this.jwtService.sign(payload);
      
      // Login logunu kaydet
      try {
        await this.logService.createLog(user.tenant_id, user.username, 'login');
      } catch (error) {
        console.error('Log kaydetme hatası:', error);
        // Log hatası login'i engellemez
      }
      
      return { result: true, token, emailVerified: user.emailVerified };
    } else {
      return { result: false };
    }
  }
  
  async refreshToken(oldToken: string) {
    try {
      const payload = this.jwtService.verify(oldToken, { ignoreExpiration: true });
      const newToken = this.jwtService.sign({ 
        username: payload.username, 
        sub: payload.sub,
        tenant_id: payload.tenant_id 
      });
      return { newToken };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getProfile(username: string) {
    const user = await this.databaseRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    return {
      id: user.id,
      username: user.username,
      tenant_id: user.tenant_id,
      firmaAdi: user.firmaAdi,
      yetkiliKisi: user.yetkiliKisi,
      telefon: user.telefon,
      email: user.email,
      adres: user.adres,
      vergiNo: user.vergiNo
    };
  }

  async updateProfile(username: string, profileData: Partial<AuthEntity>) {
    const user = await this.databaseRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Güncellenebilir alanlar
    if (profileData.firmaAdi !== undefined) user.firmaAdi = profileData.firmaAdi;
    if (profileData.yetkiliKisi !== undefined) user.yetkiliKisi = profileData.yetkiliKisi;
    if (profileData.telefon !== undefined) user.telefon = profileData.telefon;
    if (profileData.email !== undefined) user.email = profileData.email;
    if (profileData.adres !== undefined) user.adres = profileData.adres;
    if (profileData.vergiNo !== undefined) user.vergiNo = profileData.vergiNo;

    await this.databaseRepository.save(user);

    return {
      id: user.id,
      username: user.username,
      tenant_id: user.tenant_id,
      firmaAdi: user.firmaAdi,
      yetkiliKisi: user.yetkiliKisi,
      telefon: user.telefon,
      email: user.email,
      adres: user.adres,
      vergiNo: user.vergiNo
    };
  }

  async changePassword(username: string, oldPassword: string, newPassword: string) {
    const user = await this.databaseRepository.findOne({
      where: { username, password: oldPassword }
    });

    if (!user) {
      throw new Error('Eski şifre hatalı');
    }

    if (newPassword.length < 3) {
      throw new Error('Yeni şifre en az 3 karakter olmalıdır');
    }

    user.password = newPassword;
    await this.databaseRepository.save(user);

    return { success: true, message: 'Şifre başarıyla değiştirildi' };
  }

  async logout(tenantId: number, username: string) {
    // Logout logunu kaydet
    try {
      await this.logService.createLog(tenantId, username, 'logout');
      return { success: true, message: 'Çıkış yapıldı' };
    } catch (error) {
      console.error('Logout log kaydetme hatası:', error);
      // Log hatası logout'u engellemez
      return { success: true, message: 'Çıkış yapıldı' };
    }
  }

  async verifyEmail(token: string) {
    const user = await this.databaseRepository.findOne({
      where: { verificationToken: token }
    });

    if (!user) {
      throw new Error('Geçersiz doğrulama token\'ı');
    }

    if (user.emailVerified) {
      throw new Error('Email zaten doğrulanmış');
    }

    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      throw new Error('Doğrulama token\'ı süresi dolmuş');
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    await this.databaseRepository.save(user);

    return { success: true, message: 'Email başarıyla doğrulandı' };
  }

  async resendVerificationEmail(username: string) {
    const user = await this.databaseRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    if (user.emailVerified) {
      throw new Error('Email zaten doğrulanmış');
    }

    if (!user.email) {
      throw new Error('Kullanıcının email adresi yok');
    }

    // Yeni token oluştur
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await this.databaseRepository.save(user);

    // Email gönder
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.username
    );

    return { success: true, message: 'Doğrulama email\'i tekrar gönderildi' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.databaseRepository.findOne({
      where: { email }
    });

    if (!user) {
      // Güvenlik için: Email yoksa da başarılı mesajı döndür (email enumeration saldırısını önler)
      return { success: true, message: 'Eğer bu email adresi kayıtlıysa, şifre sıfırlama linki gönderildi.' };
    }

    // Şifre sıfırlama token'ı oluştur
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 saat geçerli

    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await this.databaseRepository.save(user);

    // Email gönder
    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.username
      );
    } catch (error) {
      console.error('Şifre sıfırlama email gönderme hatası:', error);
      throw new Error('Email gönderilemedi. Lütfen tekrar deneyin.');
    }

    return { success: true, message: 'Eğer bu email adresi kayıtlıysa, şifre sıfırlama linki gönderildi.' };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 3) {
      throw new Error('Yeni şifre en az 3 karakter olmalıdır');
    }

    const user = await this.databaseRepository.findOne({
      where: { resetToken: token }
    });

    if (!user) {
      throw new Error('Geçersiz veya süresi dolmuş şifre sıfırlama token\'ı');
    }

    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      throw new Error('Şifre sıfırlama token\'ı süresi dolmuş. Lütfen yeni bir istek yapın.');
    }

    // Şifreyi güncelle
    user.password = newPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await this.databaseRepository.save(user);

    return { success: true, message: 'Şifre başarıyla sıfırlandı' };
  }
}
