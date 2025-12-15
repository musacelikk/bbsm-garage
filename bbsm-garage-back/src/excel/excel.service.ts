import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as https from 'https';
import { CardService } from '../card/card.service';
import { TeklifService } from '../teklif/teklif.service';

@Injectable()
export class ExcelService {
  private readonly logger = new Logger(ExcelService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => CardService))
    private readonly cardService: CardService,
    @Inject(forwardRef(() => TeklifService))
    private readonly teklifService: TeklifService,
  ) {}

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