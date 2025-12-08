import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { AuthEntity } from './auth/auth.entity';
import { MembershipRequestEntity } from './auth/membership-request.entity';
import { CardEntity } from './card/entities/card.entity';
import { StokEntity } from './stok/entities/stok.entity';
import { TeklifEntity } from './teklif/entities/teklif.entity';
import { YapilanlarEntity } from './yapilanlar/entities/yapilanlar.entity';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [AuthEntity, MembershipRequestEntity, CardEntity, StokEntity, TeklifEntity, YapilanlarEntity],
  migrations: ['migrations/*.ts'],
  synchronize: true, // Local development için true (ilk tablo oluşturma için)
  logging: true,
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
    ca: process.env.DB_SSL_CERT
  } : false,
});

