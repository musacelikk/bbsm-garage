import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvDto } from './env-dto/env-dto';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { log } from 'console';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { AuthEntity } from './auth/auth.entity';
import { CardModule } from './card/card.module';
import { StokModule } from './stok/stok.module';
import { TeklifModule } from './teklif/teklif.module';
import { YapilanlarModule } from './yapilanlar/yapilanlar.module';
import { ExcelModule } from './excel/excel.module';
import { HttpModule } from '@nestjs/axios';
import { LogModule } from './log/log.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

let env = new EnvDto();

log(env); 

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 dakika
      limit: 100, // 100 istek/dakika (genel limit)
    }]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [],
      synchronize: true,
      autoLoadEntities: true,
      ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        ca: process.env.DB_SSL_CERT
      } : false,
      extra: process.env.DB_SSL === 'true' ? {
        ssl: {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false'
        }
      } : {}
    }),
    AuthModule,
    CardModule,
    StokModule,
    TeklifModule,
    YapilanlarModule,
    ExcelModule,
    HttpModule,
    LogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
