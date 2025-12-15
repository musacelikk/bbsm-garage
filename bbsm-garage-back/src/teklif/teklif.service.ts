import { Injectable } from '@nestjs/common';
import { UpdateYapilanlarDto } from '../yapilanlar/dto/update-yapilanlar.dto';
import { UpdateTeklifDto } from "./dto/update-teklif.dto";
import { CreateTeklifDto } from "./dto/create-teklif.dto";
import { TeklifEntity } from "./entities/teklif.entity";
import { YapilanlarEntity } from "../yapilanlar/entities/yapilanlar.entity";
import { Repository } from "typeorm";
import { InjectRepository } from '@nestjs/typeorm';
import { LogService } from '../log/log.service';

@Injectable()
export class TeklifService {
  constructor(
    @InjectRepository(TeklifEntity)
    private databaseRepository: Repository<TeklifEntity>,
    @InjectRepository(YapilanlarEntity)
    private yapilanlarRepository: Repository<YapilanlarEntity>,
    private readonly logService: LogService,
  ) {}

  async create(createTeklifDto: CreateTeklifDto, tenant_id: number, username?: string): Promise<TeklifEntity> {
    try {
      // teklif_id, yapilanlar ve Entity'de olmayan alanları çıkar
      const { teklif_id, yapilanlar, odemeAlindi, periyodikBakim, duzenleyen, ...teklifDataWithoutId } = createTeklifDto;
      // TeklifEntity oluşturuluyor ve veritabanına kaydediliyor (yapilanlar olmadan)
      const teklif = await this.databaseRepository.create({ ...teklifDataWithoutId as unknown as Partial<TeklifEntity>, tenant_id });
      const savedTeklif = await this.databaseRepository.save(teklif);

      // Yapilanlar ekleniyor (teklif kaydedildikten sonra)
      if (yapilanlar && yapilanlar.length > 0) {
        const yapilanlarEntities = yapilanlar.map(dto => {
          const yapilan = new YapilanlarEntity();
          // id'yi çıkar çünkü auto-increment
          yapilan.birimAdedi = dto.birimAdedi;
          yapilan.parcaAdi = dto.parcaAdi;
          yapilan.birimFiyati = dto.birimFiyati;
          yapilan.toplamFiyat = dto.toplamFiyat;
          yapilan.tenant_id = tenant_id;
          yapilan.teklif = savedTeklif; // İlişkiyi belirtmek için teklif referansı ekleniyor
          return yapilan;
        });

        // Yapilanlar'ı direkt kaydet (tenant_id'nin kaybolmaması için)
        await this.yapilanlarRepository.save(yapilanlarEntities);
      }

      // Log kaydı oluştur
      if (username) {
        try {
          await this.logService.createLog(tenant_id, username, 'teklif_create');
        } catch (error) {
          console.error('Teklif oluşturma log kaydetme hatası:', error);
        }
      }

      return this.databaseRepository.findOne({ where: { teklif_id: savedTeklif.teklif_id }, relations: ["yapilanlar"] });
    } catch (error) {
      throw error;
    }
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

    // Mevcut yapilanlar'ı sil
    if (teklif.yapilanlar && teklif.yapilanlar.length > 0) {
      await this.yapilanlarRepository.remove(teklif.yapilanlar);
    }

    // Yeni yapilanlar oluştur
    const yapilanlarEntities = updateYapilanlarDto.map(dto => {
      const yapilan = new YapilanlarEntity();
      yapilan.birimAdedi = dto.birimAdedi;
      yapilan.parcaAdi = dto.parcaAdi;
      yapilan.birimFiyati = dto.birimFiyati;
      yapilan.toplamFiyat = dto.toplamFiyat;
      yapilan.tenant_id = tenant_id;
      yapilan.teklif = teklif; // Set the relationship
      return yapilan;
    });

    // Yapilanlar'ı direkt kaydet (tenant_id'nin kaybolmaması için)
    await this.yapilanlarRepository.save(yapilanlarEntities);
    
    return this.findOne(id, tenant_id);
  }

  async remove(id: number, tenant_id: number, username?: string): Promise<void> {
    await this.databaseRepository.delete({ teklif_id: id, tenant_id });
    
    // Log kaydı oluştur
    if (username) {
      try {
        await this.logService.createLog(tenant_id, username, 'teklif_delete');
      } catch (error) {
        console.error('Teklif silme log kaydetme hatası:', error);
      }
    }
  }

  async removeAll(tenant_id: number): Promise<void> {
    await this.databaseRepository.delete({ tenant_id });
  }
}
