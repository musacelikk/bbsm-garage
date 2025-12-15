import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { CardModule } from '../card/card.module';
import { TeklifModule } from '../teklif/teklif.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => CardModule),
    forwardRef(() => TeklifModule),
  ],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {} 