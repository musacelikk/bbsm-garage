import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { LogEntity } from './entities/log.entity';

@Injectable()
export class LogService {
  constructor(
    @InjectRepository(LogEntity) private logRepository: Repository<LogEntity>
  ) {}

  async createLog(tenantId: number, username: string, action: string, duzenleyen?: string): Promise<LogEntity> {
    const log = this.logRepository.create({
      tenant_id: tenantId,
      username,
      action,
      duzenleyen: duzenleyen || null,
      timestamp: new Date()
    });
    return this.logRepository.save(log);
  }

  async getLogsByTenant(tenantId: number, limit: number = 100): Promise<LogEntity[]> {
    return this.logRepository.find({
      where: { tenant_id: tenantId },
      order: { timestamp: 'DESC' },
      take: limit
    });
  }

  async getLogsByUsername(tenantId: number, username: string, limit: number = 100): Promise<LogEntity[]> {
    return this.logRepository.find({
      where: { tenant_id: tenantId, username },
      order: { timestamp: 'DESC' },
      take: limit
    });
  }
}

