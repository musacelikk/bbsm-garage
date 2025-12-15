import { Injectable } from '@nestjs/common';
import { UpdateStokDto } from './dto/update-stok.dto';
import { CreateStokDto } from './dto/create-stok.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { StokEntity } from './entities/stok.entity';
import { Repository } from 'typeorm';
import { LogService } from '../log/log.service';


@Injectable()
export class StokService {
  constructor(
    @InjectRepository(StokEntity) private databaseRepository: Repository<StokEntity>,
    private readonly logService: LogService,
  ) {}
  
  async create(createStokDto: CreateStokDto, tenant_id: number, username?: string) {
    const stokData: any = {
      ...createStokDto,
      tenant_id,
    };
    
    // Tarih string ise Date'e dönüştür, yoksa bugünün tarihini kullan
    if (createStokDto.eklenisTarihi) {
      stokData.eklenisTarihi = new Date(createStokDto.eklenisTarihi);
    } else {
      stokData.eklenisTarihi = new Date();
    }
    
    const savedStok = await this.databaseRepository.save(stokData);

    // Log kaydı oluştur
    if (username) {
      try {
        await this.logService.createLog(tenant_id, username, 'stok_create');
      } catch (error) {
        console.error('Stok ekleme log kaydetme hatası:', error);
      }
    }

    return savedStok;
  }

  findAll(tenant_id: number) {
    return this.databaseRepository.find({ where: { tenant_id } });
  }

  async findOne(id: number, tenant_id: number) {
    const result = await this.databaseRepository.find({ 
      where: { 
        id: id,
        tenant_id: tenant_id
      }
    });
    // Stok güncellendi
    return result;
  }

  async update(id: number, updateStokDto: UpdateStokDto, tenant_id: number, username?: string) {
    await this.databaseRepository.update({ id, tenant_id }, updateStokDto);

    // Log kaydı oluştur
    if (username) {
      try {
        await this.logService.createLog(tenant_id, username, 'stok_update');
      } catch (error) {
        console.error('Stok güncelleme log kaydetme hatası:', error);
      }
    }

    return this.databaseRepository.findOne({ where: { id, tenant_id } });
  }
  
  removeAll(tenant_id: number) {
    return this.databaseRepository.delete({ tenant_id });
  }
  
  async remove(id: number, tenant_id: number, username?: string) {
    await this.databaseRepository.delete({ id, tenant_id });

    // Log kaydı oluştur
    if (username) {
      try {
        await this.logService.createLog(tenant_id, username, 'stok_delete');
      } catch (error) {
        console.error('Stok silme log kaydetme hatası:', error);
      }
    }
  }

  async updateAdet(id: number, operation: 'increment' | 'decrement', tenant_id: number) {
    const stok = await this.databaseRepository.findOne({ where: { id, tenant_id } });
    if (!stok) {
      throw new Error('Stok bulunamadı');
    }

    if (operation === 'increment') {
      stok.adet += 1;
    } else if (operation === 'decrement' && stok.adet > 0) {
      stok.adet -= 1;
    }

    return this.databaseRepository.save(stok);
  }
}
