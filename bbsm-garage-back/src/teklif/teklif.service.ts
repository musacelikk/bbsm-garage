import { Injectable } from '@nestjs/common';
import { UpdateYapilanlarDto } from '../yapilanlar/dto/update-yapilanlar.dto';
import { UpdateTeklifDto } from "./dto/update-teklif.dto";
import { CreateTeklifDto } from "./dto/create-teklif.dto";
import { TeklifEntity } from "./entities/teklif.entity";
import { YapilanlarEntity } from "../yapilanlar/entities/yapilanlar.entity";
import { Repository } from "typeorm";
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TeklifService {
  constructor(
    @InjectRepository(TeklifEntity)
    private databaseRepository: Repository<TeklifEntity>,
  ) {}

  async create(createTeklifDto: CreateTeklifDto, tenant_id: number): Promise<TeklifEntity> {
    const teklif = await this.databaseRepository.create({ ...createTeklifDto as unknown as Partial<TeklifEntity>, tenant_id });
    return this.databaseRepository.save(teklif);
  }

  findAll(tenant_id: number): Promise<TeklifEntity[]> {
    return this.databaseRepository.find({ 
      where: { tenant_id },
      relations: ['yapilanlar'] 
    });
  }

  async findOne(id: number, tenant_id: number): Promise<TeklifEntity> {
    return await this.databaseRepository.findOne({
      where: { teklif_id: id, tenant_id },
      relations: ['yapilanlar'],
    });
  }

  async update(id: number, updateTeklifDto: UpdateTeklifDto, tenant_id: number): Promise<TeklifEntity> {
    await this.databaseRepository.update({ teklif_id: id, tenant_id }, updateTeklifDto as unknown as Partial<TeklifEntity>);
    return this.findOne(id, tenant_id);
  }

  async updateYapilanlar(id: number, updateYapilanlarDto: UpdateYapilanlarDto[], tenant_id: number): Promise<TeklifEntity> {
    const teklif = await this.findOne(id, tenant_id);

    // Clear existing yapilanlar and create new ones from the DTO
    teklif.yapilanlar = updateYapilanlarDto.map(dto => {
      const yapilan = new YapilanlarEntity();
      yapilan.id = dto.id;
      yapilan.birimAdedi = dto.birimAdedi;
      yapilan.parcaAdi = dto.parcaAdi;
      yapilan.birimFiyati = dto.birimFiyati;
      yapilan.toplamFiyat = dto.toplamFiyat;
      yapilan.tenant_id = tenant_id;
      yapilan.teklif = teklif; // Set the relationship
      return yapilan;
    });

    await this.databaseRepository.save(teklif);
    return this.findOne(id, tenant_id);
  }

  async remove(id: number, tenant_id: number): Promise<void> {
    await this.databaseRepository.delete({ teklif_id: id, tenant_id });
  }

  async removeAll(tenant_id: number): Promise<void> {
    await this.databaseRepository.delete({ tenant_id });
  }
}
