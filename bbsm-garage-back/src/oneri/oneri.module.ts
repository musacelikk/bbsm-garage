import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OneriController } from './oneri.controller';
import { OneriService } from './oneri.service';
import { OneriEntity } from './entities/oneri.entity';
import { NotificationEntity } from '../notification/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OneriEntity, NotificationEntity]),
  ],
  controllers: [OneriController],
  providers: [OneriService],
  exports: [OneriService],
})
export class OneriModule {}
