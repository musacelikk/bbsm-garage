import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthEntity } from './auth.entity';
import { AuthDto } from './auth.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(AuthEntity) private databaseRepository: Repository<AuthEntity>,
    private readonly jwtService: JwtService
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
      password: database.password
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

    return this.databaseRepository.save(newUser);
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
      return { result: true, token };
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
}
