import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as https from 'https';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(private readonly httpService: HttpService) {}

  async generateExcel(data: any): Promise<Buffer> {
    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });

      const excelResponse: AxiosResponse<ArrayBuffer> = await firstValueFrom(
        this.httpService.post('https://13.61.75.15/api/excel/download', data, {
          responseType: 'arraybuffer',
          headers: {
            'Content-Type': 'application/json',
          },
          httpsAgent: httpsAgent
        })
      );

      if (!excelResponse.data) {
        throw new Error('No data received from Excel service');
      }

      return Buffer.from(excelResponse.data);
    } catch (error) {
      this.logger.error('Error generating Excel:', error);
      throw new Error(`Failed to generate Excel: ${error.message}`);
    }
  }

  async generatePDF(data: any): Promise<Buffer> {
    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false
      });

      const pdfResponse: AxiosResponse<ArrayBuffer> = await firstValueFrom(
        this.httpService.post('https://13.61.75.15/api/excel/pdf', data, {
          responseType: 'arraybuffer',
          headers: {
            'Content-Type': 'application/json',
          },
          httpsAgent: httpsAgent
        })
      );

      if (!pdfResponse.data) {
        throw new Error('No data received from PDF service');
      }

      return Buffer.from(pdfResponse.data);
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }
} 