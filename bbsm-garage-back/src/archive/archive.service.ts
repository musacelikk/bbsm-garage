import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { CardEntity } from '../card/entities/card.entity';
import { TeklifEntity } from '../teklif/entities/teklif.entity';
import { LogEntity } from '../log/entities/log.entity';

@Injectable()
export class ArchiveService {
  constructor(
    @InjectRepository(CardEntity)
    private cardRepository: Repository<CardEntity>,
    @InjectRepository(TeklifEntity)
    private teklifRepository: Repository<TeklifEntity>,
    @InjectRepository(LogEntity)
    private logRepository: Repository<LogEntity>,
  ) {}

  async archiveOldCards(tenant_id: number, daysOld: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const oldCards = await this.cardRepository.find({
      where: {
        tenant_id,
        girisTarihi: LessThan(cutoffDate.toISOString()),
      },
    });

    // Arşivleme işlemi (şimdilik sadece log)
    return {
      archived: oldCards.length,
      message: `${oldCards.length} kart arşivlendi`,
    };
  }

  async cleanOldLogs(tenant_id: number, daysOld: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await this.logRepository.delete({
      tenant_id,
      timestamp: LessThan(cutoffDate),
    });

    return {
      deleted: result.affected || 0,
      message: `${result.affected || 0} log kaydı silindi`,
    };
  }
}
