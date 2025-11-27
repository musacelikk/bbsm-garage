import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ExcelController } from './excel.controller';
import { ExcelService } from './excel.service';

@Module({
  imports: [HttpModule],
  controllers: [ExcelController],
  providers: [ExcelService],
})
export class ExcelModule {} 