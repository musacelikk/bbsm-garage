import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { CardEntity } from '../card/entities/card.entity';
import { TeklifEntity } from '../teklif/entities/teklif.entity';
import { StokEntity } from '../stok/entities/stok.entity';
import { YapilanlarEntity } from '../yapilanlar/entities/yapilanlar.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CardEntity, TeklifEntity, StokEntity, YapilanlarEntity]),
  ],
  controllers: [BackupController],
  providers: [BackupService],
  exports: [BackupService],
})
export class BackupModule {}
