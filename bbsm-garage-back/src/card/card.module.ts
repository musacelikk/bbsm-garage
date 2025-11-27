import { Module } from '@nestjs/common';
import { CardService } from './card.service';
import { CardController } from './card.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardEntity } from './entities/card.entity';
import { YapilanlarController } from 'src/yapilanlar/yapilanlar.controller';
import { YapilanlarEntity } from 'src/yapilanlar/entities/yapilanlar.entity';
import { TeklifEntity } from 'src/teklif/entities/teklif.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CardEntity,TeklifEntity,YapilanlarEntity])],
  controllers: [CardController],
  providers: [CardService],
})
export class CardModule {}
