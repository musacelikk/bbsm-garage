import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { CardModule } from './card/card.module';
import { StokModule } from './stok/stok.module';
import { TeklifModule } from './teklif/teklif.module';
import { YapilanlarModule } from './yapilanlar/yapilanlar.module';
import { ExcelModule } from './excel/excel.module';
import { HttpModule } from '@nestjs/axios';
import { LogModule } from './log/log.module';
import { OneriModule } from './oneri/oneri.module';
import { NotificationModule } from './notification/notification.module';
import { BackupModule } from './backup/backup.module';
import { ArchiveModule } from './archive/archive.module';
import { WebhookModule } from './webhook/webhook.module';
import { ContactModule } from './contact/contact.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: parseInt(configService.get('DB_PORT', '5432')),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE'),
        entities: [],
        synchronize: true,
        autoLoadEntities: true,
        ssl: configService.get('DB_SSL') === 'true' ? {
          rejectUnauthorized: configService.get('DB_SSL_REJECT_UNAUTHORIZED') !== 'false',
          ca: configService.get('DB_SSL_CERT')
        } : false,
        extra: {
          ...(configService.get('DB_SSL') === 'true' ? {
            ssl: {
              rejectUnauthorized: configService.get('DB_SSL_REJECT_UNAUTHORIZED') !== 'false'
            }
          } : {}),
          connectionTimeoutMillis: 10000,
          max: 10,
        },
        retryAttempts: 5,
        retryDelay: 3000,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    CardModule,
    StokModule,
    TeklifModule,
    YapilanlarModule,
    ExcelModule,
    HttpModule,
    LogModule,
    OneriModule,
    NotificationModule,
    BackupModule,
    ArchiveModule,
    WebhookModule,
    ContactModule,
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
