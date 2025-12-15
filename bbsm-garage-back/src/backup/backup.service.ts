import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardEntity } from '../card/entities/card.entity';
import { TeklifEntity } from '../teklif/entities/teklif.entity';
import { StokEntity } from '../stok/entities/stok.entity';
import { YapilanlarEntity } from '../yapilanlar/entities/yapilanlar.entity';

@Injectable()
export class BackupService {
  constructor(
    @InjectRepository(CardEntity)
    private cardRepository: Repository<CardEntity>,
    @InjectRepository(TeklifEntity)
    private teklifRepository: Repository<TeklifEntity>,
    @InjectRepository(StokEntity)
    private stokRepository: Repository<StokEntity>,
    @InjectRepository(YapilanlarEntity)
    private yapilanlarRepository: Repository<YapilanlarEntity>,
  ) {}

  async createBackup(tenant_id: number) {
    const cards = await this.cardRepository.find({ where: { tenant_id }, relations: ['yapilanlar'] });
    const teklifler = await this.teklifRepository.find({ where: { tenant_id }, relations: ['yapilanlar'] });
    const stoklar = await this.stokRepository.find({ where: { tenant_id } });
    
    return {
      tenant_id,
      timestamp: new Date().toISOString(),
      version: '1.0',
      data: {
        cards,
        teklifler,
        stoklar,
      },
    };
  }

  async restoreBackup(tenant_id: number, backupData: any) {
    // Yedek geri yükleme işlemi (dikkatli kullanılmalı)
    // Bu işlem mevcut verileri silebilir veya üzerine yazabilir
    // Production'da ekstra güvenlik önlemleri alınmalı
    
    if (backupData.data.cards) {
      // Kartları geri yükle
      for (const card of backupData.data.cards) {
        const { card_id, yapilanlar, ...cardData } = card;
        const newCard = this.cardRepository.create({ ...cardData, tenant_id });
        const savedCard = await this.cardRepository.save(newCard);
        
        if (yapilanlar && yapilanlar.length > 0) {
          const yapilanlarEntities = yapilanlar.map(y => ({
            ...y,
            id: undefined,
            card: savedCard,
            tenant_id,
          }));
          await this.yapilanlarRepository.save(yapilanlarEntities);
        }
      }
    }
    
    return { message: 'Yedek başarıyla geri yüklendi' };
  }

  async listBackups(tenant_id: number) {
    // Yedek listesi (dosya sisteminden veya veritabanından)
    // Şimdilik basit bir implementasyon
    return [];
  }
}
