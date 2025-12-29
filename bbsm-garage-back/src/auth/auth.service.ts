import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from './auth.entity';
import { MembershipRequestEntity } from './membership-request.entity';
import { AuthDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';
import { LogService } from '../log/log.service';
import { EmailService } from '../email/email.service';
import { OneriService } from '../oneri/oneri.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity) private databaseRepository: Repository<AuthEntity>,
    @InjectRepository(MembershipRequestEntity) private membershipRequestRepository: Repository<MembershipRequestEntity>,
    private readonly jwtService: JwtService,
    private readonly logService: LogService,
    private readonly emailService: EmailService,
    private readonly oneriService: OneriService,
  ) {}

  findAll(): any {
    return this.databaseRepository.find();
  }

  // Şifre güçlülük kontrolü
  private validatePasswordStrength(password: string): void {
    if (!password || password.length < 8) {
      throw new BadRequestException('Şifre en az 8 karakter olmalıdır');
    }

    if (password.length > 128) {
      throw new BadRequestException('Şifre en fazla 128 karakter olabilir');
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    const errors: string[] = [];
    if (!hasUpperCase) {
      errors.push('en az bir büyük harf');
    }
    if (!hasLowerCase) {
      errors.push('en az bir küçük harf');
    }
    if (!hasNumbers) {
      errors.push('en az bir sayı');
    }
    if (!hasSpecialChar) {
      errors.push('en az bir özel karakter (!@#$%^&*()_+-=[]{}|;:,.<>?)');
    }

    if (errors.length > 0) {
      throw new BadRequestException(
        `Şifre güvenliği için şunlar gereklidir: ${errors.join(', ')}`
      );
    }
  }

  // Şifre hash'leme
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  // Şifre doğrulama
  private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async addOne(database: AuthDto): Promise<AuthEntity> {
    const existingUser = await this.databaseRepository.findOne({
      where: { username: database.username }
    });
    
    if (existingUser) {
      throw new Error('Bu kullanıcı adı zaten kullanılıyor');
    }

    // Şifre güçlülük kontrolü
    this.validatePasswordStrength(database.password);

    // Şifreyi hash'le
    const hashedPassword = await this.hashPassword(database.password);

    const newUser = this.databaseRepository.create({
      username: database.username,
      password: hashedPassword,
      firmaAdi: database.firmaAdi || null,
      yetkiliKisi: database.yetkiliKisi || null,
      telefon: database.telefon || null,
      email: database.email || null,
      adres: database.adres || null,
      vergiNo: database.vergiNo || null
    });

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

    // Email doğrulama kodu oluştur (6 haneli)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    newUser.verificationToken = verificationCode;
    newUser.verificationTokenExpiry = verificationTokenExpiry;
    newUser.emailVerified = false;
    newUser.isActive = false; // Email doğrulanana kadar pasif kalacak

    const savedUser = await this.databaseRepository.save(newUser);

    // Email gönder (eğer email varsa)
    if (savedUser.email) {
      try {
        await this.emailService.sendVerificationCode(
          savedUser.email,
          verificationCode,
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
    const user = await this.databaseRepository.findOne({
      where: { 
        username: database.username
      }
    });
  
    if (user) {
      // Şifreyi hash ile karşılaştır
      const isPasswordValid = await this.comparePassword(database.password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      // Kullanıcı aktif değilse giriş yapamaz
      if (!user.isActive) {
        if (!user.emailVerified) {
          return { 
            result: false, 
            message: 'Email adresiniz doğrulanmamış. Lütfen kayıt sırasında gönderilen doğrulama kodunu girin.' 
          };
        }
        return { 
          result: false, 
          message: 'Hesabınız pasif durumda. Lütfen yönetici ile iletişime geçin.' 
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

  async getMembership(username: string) {
    const user = await this.databaseRepository.findOne({
      where: { username },
      select: [
        'membership_start_date',
        'membership_end_date',
        'membership_status'
      ]
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    const now = new Date();
    let status = user.membership_status || 'inactive';
    
    if (user.membership_end_date) {
      const endDate = new Date(user.membership_end_date);
      if (endDate < now && status === 'active') {
        status = 'expired';
      }
    }

    return {
      membership_start_date: user.membership_start_date,
      membership_end_date: user.membership_end_date,
      membership_status: status,
      plan: 'Standart',
      features: ['Sınırsız kart kaydı', 'Sınırsız teklif oluşturma', 'Raporlama']
    };
  }

  async getProfile(username: string) {
    const user = await this.databaseRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Bekleyen teklif kontrolü
    const pendingRequest = await this.membershipRequestRepository.findOne({
      where: { 
        user_id: user.id,
        status: 'pending'
      }
    });

    return {
      id: user.id,
      username: user.username,
      tenant_id: user.tenant_id,
      firmaAdi: user.firmaAdi,
      yetkiliKisi: user.yetkiliKisi,
      telefon: user.telefon,
      email: user.email,
      adres: user.adres,
      vergiNo: user.vergiNo,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      membership_start_date: user.membership_start_date,
      membership_end_date: user.membership_end_date,
      membership_status: user.membership_status,
      hasPendingRequest: !!pendingRequest
    };
  }

  async updateProfile(username: string, profileData: Partial<AuthEntity>, tenantId?: number) {
    const user = await this.databaseRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // E-posta değiştiyse doğrulama durumunu sıfırla ve yeni token oluştur
    if (profileData.email !== undefined && profileData.email !== user.email) {
      user.email = profileData.email;
      user.emailVerified = false;
      user.verificationToken = null;
      user.verificationTokenExpiry = null;
      
      // Yeni doğrulama token'ı oluştur
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpiry = new Date();
      verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);
      
      user.verificationToken = verificationToken;
      user.verificationTokenExpiry = verificationTokenExpiry;
      
      // Yeni e-posta adresine doğrulama email'i gönder
      try {
        await this.emailService.sendVerificationEmail(
          user.email,
          verificationToken,
          user.username
        );
      } catch (error) {
        console.error('Doğrulama email gönderme hatası:', error);
        // Email gönderme hatası profil güncellemeyi engellemez
      }
    } else {
      // E-posta değişmediyse sadece diğer alanları güncelle
    if (profileData.firmaAdi !== undefined) user.firmaAdi = profileData.firmaAdi;
    if (profileData.yetkiliKisi !== undefined) user.yetkiliKisi = profileData.yetkiliKisi;
    if (profileData.telefon !== undefined) user.telefon = profileData.telefon;
    if (profileData.email !== undefined) user.email = profileData.email;
    if (profileData.adres !== undefined) user.adres = profileData.adres;
    if (profileData.vergiNo !== undefined) user.vergiNo = profileData.vergiNo;
    }

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
      vergiNo: user.vergiNo,
      emailVerified: user.emailVerified
    };
  }

  async changePassword(username: string, oldPassword: string, newPassword: string) {
    const user = await this.databaseRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new BadRequestException('Kullanıcı bulunamadı');
    }

    // Eski şifreyi kontrol et
    const isOldPasswordValid = await this.comparePassword(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Eski şifre hatalı');
    }

    // Yeni şifre güçlülük kontrolü
    this.validatePasswordStrength(newPassword);

    // Eski ve yeni şifre aynı olamaz
    const isSamePassword = await this.comparePassword(newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException('Yeni şifre eski şifre ile aynı olamaz');
    }

    // Yeni şifreyi hash'le ve kaydet
    user.password = await this.hashPassword(newPassword);
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
    user.isActive = true; // Email doğrulandığında aktif yap
    await this.databaseRepository.save(user);

    return { success: true, message: 'Email başarıyla doğrulandı' };
  }

  async verifyEmailCode(username: string, code: string) {
    const user = await this.databaseRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    if (user.emailVerified) {
      throw new Error('Email zaten doğrulanmış');
    }

    if (!user.verificationToken) {
      throw new Error('Doğrulama kodu bulunamadı');
    }

    if (user.verificationToken !== code) {
      throw new Error('Geçersiz doğrulama kodu');
    }

    if (user.verificationTokenExpiry && new Date() > user.verificationTokenExpiry) {
      throw new Error('Doğrulama kodu süresi dolmuş');
    }

    user.emailVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpiry = null;
    user.isActive = true; // Email doğrulandığında aktif yap
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

    // Yeni 6 haneli kod oluştur
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    user.verificationToken = verificationCode;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await this.databaseRepository.save(user);

    // Email gönder
    await this.emailService.sendVerificationCode(
      user.email,
      verificationCode,
      user.username
    );

    return { success: true, message: 'Doğrulama kodu tekrar gönderildi' };
  }

  async resendVerificationCodeForRegistration(username: string) {
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

    // Yeni 6 haneli kod oluştur
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiry = new Date();
    verificationTokenExpiry.setHours(verificationTokenExpiry.getHours() + 24);

    user.verificationToken = verificationCode;
    user.verificationTokenExpiry = verificationTokenExpiry;
    await this.databaseRepository.save(user);

    // Email gönder
    await this.emailService.sendVerificationCode(
      user.email,
      verificationCode,
      user.username
    );

    return { success: true, message: 'Doğrulama kodu tekrar gönderildi' };
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

  async requestPasswordResetForAuthenticatedUser(username: string) {
    const user = await this.databaseRepository.findOne({
      where: { username }
    });

    if (!user) {
      throw new BadRequestException('Kullanıcı bulunamadı');
    }

    if (!user.email) {
      throw new BadRequestException('Email adresi kayıtlı değil. Lütfen önce profil ayarlarınızdan email adresinizi ekleyin.');
    }

    if (!user.emailVerified) {
      throw new BadRequestException('Email adresiniz doğrulanmamış. Lütfen önce email adresinizi doğrulayın.');
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
      throw new BadRequestException('Email gönderilemedi. Lütfen tekrar deneyin.');
    }

    return { success: true, message: 'Şifre sıfırlama linki email adresinize gönderildi. Lütfen email\'inizi kontrol edin.' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Şifre güçlülük kontrolü
    this.validatePasswordStrength(newPassword);

    const user = await this.databaseRepository.findOne({
      where: { resetToken: token }
    });

    if (!user) {
      throw new BadRequestException('Geçersiz veya süresi dolmuş şifre sıfırlama token\'ı');
    }

    if (user.resetTokenExpiry && new Date() > user.resetTokenExpiry) {
      throw new BadRequestException('Şifre sıfırlama token\'ı süresi dolmuş. Lütfen yeni bir istek yapın.');
    }

    // Şifreyi hash'le ve güncelle
    user.password = await this.hashPassword(newPassword);
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
          'membership_start_date',
          'membership_end_date',
          'membership_status',
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
      // JWT token süresi dolmuşsa daha anlamlı hata mesajı ver
      if (error.name === 'TokenExpiredError' || error.message?.includes('jwt expired')) {
        throw new UnauthorizedException('Token süresi dolmuş. Lütfen yeniden giriş yapın.');
      }
      console.error('getAllUsersForAdmin error:', error);
      throw new Error(error.message || 'Kullanıcılar yüklenirken bir hata oluştu');
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

  async deleteUser(authorization: string, userId: number, adminPassword: string) {
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

      // Admin şifre kontrolü
      const ADMIN_PASSWORD = '123456789';
      if (adminPassword !== ADMIN_PASSWORD) {
        throw new UnauthorizedException('Şifre yanlış');
      }

      // Silinecek kullanıcıyı bul
      const userToDelete = await this.databaseRepository.findOne({
        where: { id: userId }
      });

      if (!userToDelete) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Admin kendisini silemez
      if (userToDelete.username === 'musacelik') {
        throw new Error('Admin kullanıcısı silinemez');
      }

      // Kullanıcıya ait membership_request kayıtlarını sil (foreign key constraint hatasını önlemek için)
      try {
        await this.membershipRequestRepository.delete({ user_id: userId });
      } catch (error) {
        console.error('Membership request silme hatası:', error);
        // Hata olsa bile devam et, çünkü kayıt olmayabilir
      }

      // Kullanıcıyı sil
      await this.databaseRepository.remove(userToDelete);

      // Log kaydı oluştur
      try {
        await this.logService.createLog(
          userToDelete.tenant_id, 
          payload.username, 
          'user_deleted', 
          `Kullanıcı silindi: ${userToDelete.username} (ID: ${userId})`
        );
      } catch (error) {
        console.error('Kullanıcı silme log kaydetme hatası:', error);
      }

      return { 
        success: true, 
        message: `Kullanıcı başarıyla silindi: ${userToDelete.username}`
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error.message || 'Kullanıcı silinemedi');
    }
  }

  async addMembership(authorization: string, userId: number, months: number, customDate?: Date) {
    if (!authorization) {
      throw new UnauthorizedException('Token gerekli');
    }

    try {
      const token = authorization.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);
      
      if (!payload.isAdmin || payload.username !== 'musacelik') {
        throw new UnauthorizedException('Admin yetkisi gerekli');
      }

      const user = await this.databaseRepository.findOne({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const now = new Date();
      let newStartDate: Date;
      let newEndDate: Date;

      if (customDate) {
        newStartDate = customDate;
        const endDate = new Date(customDate);
        endDate.setMonth(endDate.getMonth() + months);
        newEndDate = endDate;
      } else {
        if (user.membership_end_date && new Date(user.membership_end_date) > now) {
          newStartDate = user.membership_start_date ? new Date(user.membership_start_date) : now;
          newEndDate = new Date(user.membership_end_date);
          newEndDate.setMonth(newEndDate.getMonth() + months);
          
          // Negatif değerler için bitiş tarihinin geçmişe gitmemesini kontrol et
          if (newEndDate < now) {
            throw new Error('Üyelik süresi geçmişe gidemez');
          }
        } else {
          // Kullanıcının üyeliği yoksa veya süresi dolmuşsa negatif değer kabul edilemez
          if (months < 0) {
            throw new Error('Üyelik süresi olmayan kullanıcıdan süre kısılamaz');
          }
          newStartDate = now;
          newEndDate = new Date(now);
          newEndDate.setMonth(newEndDate.getMonth() + months);
        }
      }

      user.membership_start_date = newStartDate;
      user.membership_end_date = newEndDate;
      
      // Bitiş tarihi geçmişteyse üyelik durumunu expired yap
      if (newEndDate < now) {
        user.membership_status = 'expired';
      } else {
      user.membership_status = 'active';
      user.isActive = true;
      }

      await this.databaseRepository.save(user);

      // Log kaydı oluştur
      try {
        const logAction = months < 0 ? 'membership_reduce' : 'membership_add';
        await this.logService.createLog(user.tenant_id, user.username, logAction, null);
      } catch (error) {
        console.error('Üyelik işlemi log kaydetme hatası:', error);
      }

      const message = months < 0 
        ? `${Math.abs(months)} ay üyelik süresi kısıldı`
        : `${months} ay üyelik eklendi`;

      return { 
        success: true, 
        message: message,
        membership_start_date: newStartDate,
        membership_end_date: newEndDate
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error.message || 'Üyelik eklenemedi');
    }
  }

  async selectMembershipPlan(username: string, months: number) {
    try {
      const user = await this.databaseRepository.findOne({
        where: { username }
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      // Bekleyen bir teklif var mı kontrol et
      const existingRequest = await this.membershipRequestRepository.findOne({
        where: { 
          user_id: user.id,
          status: 'pending'
        }
      });

      if (existingRequest) {
        throw new Error('Zaten bekleyen bir teklifiniz bulunmaktadır.');
      }

      // Yeni teklif oluştur
      const membershipRequest = this.membershipRequestRepository.create({
        user_id: user.id,
        username: user.username,
        months: months,
        status: 'pending'
      });

      await this.membershipRequestRepository.save(membershipRequest);

      return { 
        success: true, 
        message: 'Teklifi gönderildi',
        request_id: membershipRequest.id
      };
    } catch (error) {
      throw new Error(error.message || 'Üyelik planı seçilemedi');
    }
  }

  async getAllMembershipRequests(authorization: string) {
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

      const requests = await this.membershipRequestRepository.find({
        order: {
          created_at: 'DESC'
        }
      });

      // Her teklif için kullanıcı bilgilerini ekle
      const requestsWithUserInfo = await Promise.all(
        requests.map(async (request) => {
          const user = await this.databaseRepository.findOne({
            where: { id: request.user_id },
            select: ['id', 'username', 'isActive', 'firmaAdi']
          });
          return {
            ...request,
            user_id: request.user_id,
            user_isActive: user?.isActive ?? false,
            user_firmaAdi: user?.firmaAdi ?? null
          };
        })
      );

      return requestsWithUserInfo;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // JWT token süresi dolmuşsa daha anlamlı hata mesajı ver
      if (error.name === 'TokenExpiredError' || error.message?.includes('jwt expired')) {
        throw new UnauthorizedException('Token süresi dolmuş. Lütfen yeniden giriş yapın.');
      }
      console.error('getAllMembershipRequests error:', error);
      throw new Error(error.message || 'Teklifler yüklenirken bir hata oluştu');
    }
  }

  async approveMembershipRequest(authorization: string, requestId: number) {
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

      const request = await this.membershipRequestRepository.findOne({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error('Teklif bulunamadı');
      }

      if (request.status !== 'pending') {
        throw new Error('Bu teklif zaten işleme alınmış');
      }

      const user = await this.databaseRepository.findOne({
        where: { id: request.user_id }
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      const now = new Date();
      let newStartDate: Date;
      let newEndDate: Date;

      // Eğer aktif bir üyelik varsa, mevcut bitiş tarihinden devam et
      if (user.membership_end_date && new Date(user.membership_end_date) > now) {
        newStartDate = user.membership_start_date ? new Date(user.membership_start_date) : now;
        newEndDate = new Date(user.membership_end_date);
        
        // Deneme sürümü için gün bazlı hesaplama (0.25 ay = 7 gün)
        if (request.months < 1) {
          newEndDate.setDate(newEndDate.getDate() + Math.round(Number(request.months) * 30));
        } else {
          newEndDate.setMonth(newEndDate.getMonth() + Number(request.months));
        }
      } else {
        // Yeni üyelik başlat
        newStartDate = now;
        newEndDate = new Date(now);
        
        // Deneme sürümü için gün bazlı hesaplama (0.25 ay = 7 gün)
        if (request.months < 1) {
          newEndDate.setDate(newEndDate.getDate() + Math.round(Number(request.months) * 30));
        } else {
          newEndDate.setMonth(newEndDate.getMonth() + Number(request.months));
        }
      }

      user.membership_start_date = newStartDate;
      user.membership_end_date = newEndDate;
      user.membership_status = 'active';
      user.isActive = true;

      await this.databaseRepository.save(user);

      request.status = 'approved';
      request.admin_response = 'Teklif onaylandı';
      await this.membershipRequestRepository.save(request);

      // Log kaydı oluştur (kullanıcı için)
      try {
        await this.logService.createLog(user.tenant_id, user.username, 'membership_request_approve', null);
      } catch (error) {
        console.error('Üyelik teklifi onaylama log kaydetme hatası:', error);
      }

      return { 
        success: true, 
        message: 'Teklif onaylandı ve üyelik aktifleştirildi',
        membership_start_date: newStartDate,
        membership_end_date: newEndDate
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error.message || 'Teklif onaylanamadı');
    }
  }

  async rejectMembershipRequest(authorization: string, requestId: number, reason?: string) {
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

      const request = await this.membershipRequestRepository.findOne({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error('Teklif bulunamadı');
      }

      if (request.status !== 'pending') {
        throw new Error('Bu teklif zaten işleme alınmış');
      }

      request.status = 'rejected';
      request.admin_response = reason || 'Teklif reddedildi';
      await this.membershipRequestRepository.save(request);

      // Log kaydı oluştur (kullanıcı için)
      try {
        const user = await this.databaseRepository.findOne({
          where: { id: request.user_id }
        });
        if (user) {
          await this.logService.createLog(user.tenant_id, user.username, 'membership_request_reject', null);
        }
      } catch (error) {
        console.error('Üyelik teklifi reddetme log kaydetme hatası:', error);
      }

      return { 
        success: true, 
        message: 'Teklif reddedildi'
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error.message || 'Teklif reddedilemedi');
    }
  }

  async getAllOneriler(authorization: string) {
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

      return await this.oneriService.findAll();
    } catch (error) {
      console.error('getAllOneriler error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // JWT token süresi dolmuşsa daha anlamlı hata mesajı ver
      if (error.name === 'TokenExpiredError' || error.message?.includes('jwt expired')) {
        throw new UnauthorizedException('Token süresi dolmuş. Lütfen yeniden giriş yapın.');
      }
      throw new Error(error.message || 'Öneriler yüklenirken bir hata oluştu');
    }
  }

  async approveOneri(authorization: string, oneriId: number, adminResponse?: string) {
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

      return await this.oneriService.approve(oneriId, adminResponse, payload.username);
    } catch (error) {
      console.error('approveOneri error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error.message || 'Öneri onaylanırken bir hata oluştu');
    }
  }

  async rejectOneri(authorization: string, oneriId: number, adminResponse?: string) {
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

      return await this.oneriService.reject(oneriId, adminResponse, payload.username);
    } catch (error) {
      console.error('rejectOneri error:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new Error(error.message || 'Öneri reddedilirken bir hata oluştu');
    }
  }
}
