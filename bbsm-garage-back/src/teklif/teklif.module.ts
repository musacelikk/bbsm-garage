import { Module } from '@nestjs/common';
import { TeklifService } from './teklif.service';
import { TeklifController } from './teklif.controller';
import { TeklifEntity } from './entities/teklif.entity';
import { YapilanlarEntity } from '../yapilanlar/entities/yapilanlar.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogModule } from '../log/log.module';

@Module({
  imports: [TypeOrmModule.forFeature([TeklifEntity, YapilanlarEntity]), LogModule],
  controllers: [TeklifController],
  providers: [TeklifService],
  exports: [TeklifService],
})
export class TeklifModule {}
