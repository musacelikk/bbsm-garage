import { Module } from '@nestjs/common';
import { TeklifService } from './teklif.service';
import { TeklifController } from './teklif.controller';
import { TeklifEntity } from './entities/teklif.entity';
import { YapilanlarEntity } from '../yapilanlar/entities/yapilanlar.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([TeklifEntity, YapilanlarEntity])],
  controllers: [TeklifController],
  providers: [TeklifService],
})
export class TeklifModule {}
