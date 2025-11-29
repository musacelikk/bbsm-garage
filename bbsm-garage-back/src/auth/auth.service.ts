import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    newUser.isActive = false; // Yeni kayıt olan kullanıcılar pasif olarak başlar

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
      
      // Kullanıcı aktif değilse giriş yapamaz
      if (!user.isActive) {
        return { 
          result: false, 
          message: 'Hesabınız henüz aktif edilmemiş. Lütfen yönetici ile iletişime geçin.' 
        };
      }
      
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

  async findAdmin(database: AuthDto) {
    // Sabit admin kullanıcı adı ve şifre kontrolü
    const ADMIN_USERNAME = 'musacelik';
    const ADMIN_PASSWORD = '123456789';

    if (!database.username || !database.password) {
      return { result: false };
    }

    // Admin kontrolü
    if (database.username === ADMIN_USERNAME && database.password === ADMIN_PASSWORD) {
      const payload = { 
        username: ADMIN_USERNAME, 
        sub: 0, // Admin için özel ID
        tenant_id: 0, // Admin için özel tenant_id
        isAdmin: true
      };
      const token = this.jwtService.sign(payload);
      
      return { 
        result: true, 
        token, 
        user: { username: ADMIN_USERNAME, isAdmin: true }
      };
    } else {
      return { result: false };
    }
  }

  async getAllUsersForAdmin(authorization: string) {
    if (!authorization) {
      throw new UnauthorizedException('Token gerekli');
    }

    try {
      const token = authorization.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      
      // Admin kontrolü
      if (!payload.isAdmin || payload.username !== 'musacelik') {
        throw new UnauthorizedException('Admin yetkisi gerekli');
      }

      // Tüm kullanıcıları getir (şifre dahil - admin için)
      const users = await this.databaseRepository.find({
        select: [
          'id',
          'tenant_id',
          'username',
          'password',
          'firmaAdi',
          'yetkiliKisi',
          'telefon',
          'email',
          'adres',
          'vergiNo',
          'emailVerified',
          'isActive',
        ],
        order: {
          id: 'DESC'
        }
      });

      return users;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Geçersiz token');
    }
  }

  async toggleUserActive(authorization: string, userId: number, isActive: boolean) {
    if (!authorization) {
      throw new UnauthorizedException('Token gerekli');
    }

    try {
      const token = authorization.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      
      // Admin kontrolü
      if (!payload.isAdmin || payload.username !== 'musacelik') {
        throw new UnauthorizedException('Admin yetkisi gerekli');
      }

      // Kullanıcıyı bul ve aktif/pasif yap
      const user = await this.databaseRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      user.isActive = isActive;
      await this.databaseRepository.save(user);

      return { success: true, message: `Kullanıcı ${isActive ? 'aktif' : 'pasif'} edildi` };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error.message || 'Kullanıcı durumu güncellenemedi');
    }
  }
}
