import { Controller, Post, Body, Res, UseGuards, Get, Query, Request } from '@nestjs/common';
import { ExcelService } from './excel.service';
import { ExcelDataDto } from './dto/excel-data.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';
import { LogService } from '../log/log.service';

@Controller('excel')
export class ExcelController {
  constructor(
    private readonly excelService: ExcelService,
    private readonly logService: LogService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('download')
  async downloadExcel(
    @Body() data: ExcelDataDto,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const excelBuffer = await this.excelService.generateExcel(data);
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=output.xlsx');
      res.send(excelBuffer);

      // Log kaydı oluştur
      if (req.user?.username && req.user?.tenant_id) {
        try {
          await this.logService.createLog(req.user.tenant_id, req.user.username, 'excel_download');
        } catch (error) {
          console.error('Excel indirme log kaydetme hatası:', error);
        }
      }
    } catch (error) {
      res.status(500).json({ message: 'Excel download failed', error: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('pdf')
  async downloadPDF(
    @Body() data: ExcelDataDto,
    @Res() res: Response,
    @Request() req,
  ) {
    try {
      const pdfBuffer = await this.excelService.generatePDF(data);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=output.pdf');
      res.send(pdfBuffer);

      // Log kaydı oluştur
      if (req.user?.username && req.user?.tenant_id) {
        try {
          await this.logService.createLog(req.user.tenant_id, req.user.username, 'pdf_download');
        } catch (error) {
          console.error('PDF indirme log kaydetme hatası:', error);
        }
      }
    } catch (error) {
      res.status(500).json({ message: 'PDF download failed', error: error.message });
    }
  }

} 