import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { YapilanlarController } from 'src/yapilanlar/yapilanlar.controller';
import { YapilanlarEntity } from 'src/yapilanlar/entities/yapilanlar.entity';
import { TeklifEntity } from 'src/teklif/entities/teklif.entity';
import { LogModule } from '../log/log.module';
import { StokModule } from '../stok/stok.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CardEntity,TeklifEntity,YapilanlarEntity]),
    LogModule,
    StokModule
  ],
  controllers: [CardController],
  providers: [CardService],
  exports: [CardService],
})
export class CardModule {}
