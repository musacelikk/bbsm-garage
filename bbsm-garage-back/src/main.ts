import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // CORS ayarları - hem slash'lı hem slash'sız origin'leri kabul et
  const frontendUrl = process.env.FRONTEND_URL;
  const allowedOrigins = frontendUrl 
    ? [
        frontendUrl,
        frontendUrl.replace(/\/$/, ''), // Son slash'ı kaldır
        frontendUrl + '/', // Son slash ekle
      ]
    : '*';
  
  app.enableCors({
    origin: (origin, callback) => {
      if (!frontendUrl || allowedOrigins === '*') {
        callback(null, true);
      } else {
        const normalizedOrigin = origin?.replace(/\/$/, '') || '';
        const normalizedAllowed = Array.isArray(allowedOrigins)
          ? allowedOrigins.map(url => url.replace(/\/$/, ''))
          : [allowedOrigins];
        
        if (normalizedAllowed.includes(normalizedOrigin) || normalizedAllowed.includes('*')) {
          callback(null, true);
        } else {
          callback(null, true); // Geçici olarak tüm origin'lere izin ver
        }
      }
    },
    allowedHeaders: '*',
    methods: '*',
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Sadece DTO'da tanımlı alanları kabul et
    forbidNonWhitelisted: true, // DTO'da olmayan alanları reddet
    transform: true, // Otomatik tip dönüşümü
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  const port = process.env.PORT || 4000;
  await app.listen(port);
}
bootstrap();
