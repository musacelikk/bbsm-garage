import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as https from 'https';
import * as ExcelJS from 'exceljs';
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

  async generateFullExport(backup: any): Promise<Buffer> {
    try {
      const workbook = new ExcelJS.Workbook();
      const data = backup.data || {};

      // Kartlar Sheet
      if (data.cards && Array.isArray(data.cards)) {
        const cardsSheet = workbook.addWorksheet('Kartlar');
        cardsSheet.columns = [
          { header: 'Ad Soyad', key: 'adSoyad', width: 20 },
          { header: 'Marka-Model', key: 'markaModel', width: 25 },
          { header: 'Plaka', key: 'plaka', width: 15 },
          { header: 'Giriş Tarihi', key: 'girisTarihi', width: 15 },
          { header: 'Ödeme Alındı', key: 'odemeAlindi', width: 15 },
        ];
        
        data.cards.forEach((card: any) => {
          cardsSheet.addRow({
            adSoyad: card.adSoyad || '',
            markaModel: card.markaModel || '',
            plaka: card.plaka || '',
            girisTarihi: card.girisTarihi || '',
            odemeAlindi: card.odemeAlindi ? 'Evet' : 'Hayır',
          });
        });
      }

      // Borçlular Sheet (ödeme alınmayan kartlar)
      if (data.cards && Array.isArray(data.cards)) {
        const borclular = data.cards.filter((card: any) => !card.odemeAlindi);
        if (borclular.length > 0) {
          const borclularSheet = workbook.addWorksheet('Borçlular');
          borclularSheet.columns = [
            { header: 'Ad Soyad', key: 'adSoyad', width: 20 },
            { header: 'Marka-Model', key: 'markaModel', width: 25 },
            { header: 'Plaka', key: 'plaka', width: 15 },
            { header: 'Giriş Tarihi', key: 'girisTarihi', width: 15 },
            { header: 'Ödeme Durumu', key: 'odemeDurumu', width: 15 },
          ];
          
          borclular.forEach((card: any) => {
            borclularSheet.addRow({
              adSoyad: card.adSoyad || '',
              markaModel: card.markaModel || '',
              plaka: card.plaka || '',
              girisTarihi: card.girisTarihi || '',
              odemeDurumu: 'Ödenmedi',
            });
          });
        }
      }

      // Teklifler Sheet
      if (data.teklifler && Array.isArray(data.teklifler)) {
        const tekliflerSheet = workbook.addWorksheet('Teklifler');
        tekliflerSheet.columns = [
          { header: 'Ad Soyad', key: 'adSoyad', width: 20 },
          { header: 'Marka-Model', key: 'markaModel', width: 25 },
          { header: 'Plaka', key: 'plaka', width: 15 },
          { header: 'Giriş Tarihi', key: 'girisTarihi', width: 15 },
        ];
        
        data.teklifler.forEach((teklif: any) => {
          tekliflerSheet.addRow({
            adSoyad: teklif.adSoyad || '',
            markaModel: teklif.markaModel || '',
            plaka: teklif.plaka || '',
            girisTarihi: teklif.girisTarihi || '',
          });
        });
      }

      // Stok Sheet
      if (data.stoklar && Array.isArray(data.stoklar)) {
        const stokSheet = workbook.addWorksheet('Stok');
        stokSheet.columns = [
          { header: 'Ürün Adı', key: 'urunAdi', width: 25 },
          { header: 'Adet', key: 'adet', width: 15 },
          { header: 'Birim Fiyatı', key: 'fiyat', width: 15 },
          { header: 'Ekleniş Tarihi', key: 'eklenisTarihi', width: 15 },
        ];
        
        data.stoklar.forEach((stok: any) => {
          stokSheet.addRow({
            urunAdi: stok.urunAdi || '',
            adet: stok.adet || 0,
            fiyat: stok.fiyat || 0,
            eklenisTarihi: stok.eklenisTarihi || '',
          });
        });
      }

      // Buffer'a dönüştür
      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      this.logger.error('Error generating full Excel export:', error);
      throw new Error(`Failed to generate full Excel export: ${error.message}`);
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