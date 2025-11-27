import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateYapilanlarDto } from './dto/create-yapilanlar.dto';
import { UpdateYapilanlarDto } from './dto/update-yapilanlar.dto';
import { YapilanlarEntity } from './entities/yapilanlar.entity';

@Injectable()
export class YapilanlarService {
  constructor(
    @InjectRepository(YapilanlarEntity) 
    private databaseRepository: Repository<YapilanlarEntity>,
  ) {}

  create(createYapilanlarDto: CreateYapilanlarDto) {
    let yeniYapilanlar = this.databaseRepository.create(createYapilanlarDto);
    return this.databaseRepository.save(yeniYapilanlar);
  }

  findAll() {
    return this.databaseRepository.find();
  }

  async findOne(id: number) {
    let yapilanlar = await this.databaseRepository.findOne({ where: { id } });
    if (!yapilanlar) {
      throw new NotFoundException(`Yapılan işlem ID: ${id} bulunamadı.`);
    }
    return yapilanlar;
  }

  async updateYapilanlar(card_id: number, updateYapilanlarDto: CreateYapilanlarDto[]) {
    let yapilanlarEntities = await this.databaseRepository.find({ where: { card: { card_id } } });

    // Mevcut yapılanları güncelleme veya yeni yapılanları ekleme
    for (const yapilanDto of updateYapilanlarDto) {
      if (yapilanDto.id) {
        // Var olan yapılanları güncelle
        let yapilan = await this.databaseRepository.findOne({ where: { id: yapilanDto.id } });
        if (yapilan) {
          for (let key in yapilanDto) {
            if (yapilanDto.hasOwnProperty(key) && yapilanDto[key] !== undefined) {
              yapilan[key] = yapilanDto[key];
            }
          }
          await this.databaseRepository.save(yapilan);
        }
      } else {
        // Yeni yapılanları ekle
        let yeniYapilan = this.databaseRepository.create({
          ...yapilanDto,
          card: { card_id },
        });
        await this.databaseRepository.save(yeniYapilan);
      }
    }
  }

  async update(id: number, updateYapilanlarDto: UpdateYapilanlarDto) {
    let yapilanlar = await this.findOne(id);
    Object.assign(yapilanlar, updateYapilanlarDto);
    return this.databaseRepository.save(yapilanlar);
  }

  async remove(id: number) {
    let yapilanlar = await this.findOne(id);
    return this.databaseRepository.remove(yapilanlar);
  }
}
