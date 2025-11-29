import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntity } from './entities/log.entity';
import { LogService } from './log.service';
import { LogController } from './log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntity])],
  controllers: [LogController],
  providers: [LogService],
  exports: [LogService]
})
export class LogModule {}

