import { Controller, Post, Body, Res } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { Response } from 'express';

@Controller('excel')
export class ExcelController {
  constructor(private readonly excelService: ExcelService) {}

  @Post('download')
  async downloadExcel(
    @Body() data: any,
    @Res() res: Response,
  ) {
    try {
      const excelBuffer = await this.excelService.generateExcel(data);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({ message: 'Excel download failed', error: error.message });
    }
  }

  @Post('pdf')
  async downloadPDF(
    @Body() data: any,
    @Res() res: Response,
  ) {
    try {
      const pdfBuffer = await this.excelService.generatePDF(data);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: 'PDF download failed', error: error.message });
    }
  }
} 