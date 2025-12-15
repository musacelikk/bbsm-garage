import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OneriController } from './oneri.controller';
import { OneriService } from './oneri.service';
import { OneriEntity } from './entities/oneri.entity';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { LogModule } from '../log/log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OneriEntity, NotificationEntity]),
    LogModule,
  ],
  controllers: [OneriController],
  providers: [OneriService],
  exports: [OneriService],
})
export class OneriModule {}
