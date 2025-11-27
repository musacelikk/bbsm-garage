import { Module } from '@nestjs/common';
import { YapilanlarService } from './yapilanlar.service';
import { YapilanlarController } from './yapilanlar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YapilanlarEntity } from './entities/yapilanlar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([YapilanlarEntity])],
  controllers: [YapilanlarController],
  providers: [YapilanlarService],
})
export class YapilanlarModule {}
