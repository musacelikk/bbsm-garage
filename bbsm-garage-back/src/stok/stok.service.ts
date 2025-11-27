import { Injectable } from '@nestjs/common';
import { UpdateStokDto } from './dto/update-stok.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { StokEntity } from './entities/stok.entity';
import { Repository } from 'typeorm';


@Injectable()
export class StokService {
  constructor(
    @InjectRepository(StokEntity) private databaseRepository: Repository<StokEntity>,) {}
  
  create(CreateStokDto: StokEntity, tenant_id: number) {
    return this.databaseRepository.save({ ...CreateStokDto, tenant_id });
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
    console.log(result);
    return result;
  }

  update(id: number, updateStokDto: UpdateStokDto, tenant_id: number) {
    return this.databaseRepository.update({ id, tenant_id }, updateStokDto);
  }
  
  removeAll(tenant_id: number) {
    return this.databaseRepository.delete({ tenant_id });
  }
  
  remove(id: number, tenant_id: number) {
    return this.databaseRepository.delete({ id, tenant_id });
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
