import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';
import { CardModule } from '../card/card.module';
import { TeklifModule } from '../teklif/teklif.module';
import { LogModule } from '../log/log.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => CardModule),
    forwardRef(() => TeklifModule),
    LogModule,
  ],
  controllers: [ExcelController],
  providers: [ExcelService],
  exports: [ExcelService],
})
export class ExcelModule {} 