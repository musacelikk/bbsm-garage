import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  dotenv.config();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors( {
    origin: '*',
    allowedHeaders: '*',
    methods: '*',
    credentials : true,
  });   
  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(4000);
}
bootstrap();
