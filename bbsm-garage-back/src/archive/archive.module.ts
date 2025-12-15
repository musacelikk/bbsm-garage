import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArchiveController } from './archive.controller';
import { ArchiveService } from './archive.service';
import { CardEntity } from '../card/entities/card.entity';
import { TeklifEntity } from '../teklif/entities/teklif.entity';
import { LogEntity } from '../log/entities/log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CardEntity, TeklifEntity, LogEntity]),
  ],
  controllers: [ArchiveController],
  providers: [ArchiveService],
})
export class ArchiveModule {}
