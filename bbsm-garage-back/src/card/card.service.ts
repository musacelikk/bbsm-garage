import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { CardEntity } from './entities/card.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { YapilanlarEntity } from 'src/yapilanlar/entities/yapilanlar.entity';
import { CreateYapilanlarDto } from 'src/yapilanlar/dto/create-yapilanlar.dto';
import { LogService } from '../log/log.service';
import { StokService } from '../stok/stok.service';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(CardEntity) 
    private databaseRepository: Repository<CardEntity>,
    @InjectRepository(YapilanlarEntity) 
    private yapilanlarRepository: Repository<YapilanlarEntity>,
    private readonly logService: LogService,
    private readonly stokService: StokService,
  ) {}

  async create(createCardDto: CreateCardDto, tenant_id: number, username?: string) {
    try {
      // card_id ve yapilanlar'ı çıkar çünkü auto-increment ve ayrı kaydedilecek
      const { card_id, yapilanlar, ...cardDataWithoutId } = createCardDto;
      
      // Periyodik bakım değerini açıkça ekle ve string'den boolean'a dönüştür
      const periyodikBakimValue = createCardDto.periyodikBakim !== undefined 
        ? (createCardDto.periyodikBakim === true || String(createCardDto.periyodikBakim) === 'true' || Number(createCardDto.periyodikBakim) === 1)
        : false;
      
      const cardDataToSave = {
        ...cardDataWithoutId,
        periyodikBakim: periyodikBakimValue,
        tenant_id,
      };
      
      console.log('CardService.create - cardDataToSave:', cardDataToSave);
      console.log('CardService.create - periyodikBakim:', cardDataToSave.periyodikBakim, typeof cardDataToSave.periyodikBakim);
      
      // CardEntity oluşturuluyor ve veritabanına kaydediliyor (yapilanlar olmadan)
      const card = await this.databaseRepository.create(cardDataToSave);
      const savedCard = await this.databaseRepository.save(card);
      
      console.log('CardService.create - savedCard:', savedCard);
      console.log('CardService.create - savedCard.periyodikBakim:', savedCard.periyodikBakim, typeof savedCard.periyodikBakim);

      // Yapilanlar ekleniyor (card kaydedildikten sonra)
      if (yapilanlar && yapilanlar.length > 0) {
        // Stoktan düşme işlemleri (kart eklerken stoktan düşülür)
        for (const dto of yapilanlar) {
          // Debug: Stok bilgilerini kontrol et
          console.log('CardService - yapilanlar DTO:', dto);
          console.log('CardService - isFromStock:', dto.isFromStock, 'stockId:', dto.stockId);
          
          if (dto.isFromStock && dto.stockId) {
            try {
              // Stok kontrolü ve düşme
              const stok = await this.stokService.findOne(dto.stockId, tenant_id);
              if (!stok || stok.length === 0) {
                throw new BadRequestException(`Stok bulunamadı (ID: ${dto.stockId})`);
              }
              const stokItem = stok[0];
              console.log('CardService - Stok bulundu:', stokItem.stokAdi, 'Mevcut adet:', stokItem.adet, 'Talep edilen:', dto.birimAdedi);
              
              if (stokItem.adet < dto.birimAdedi) {
                throw new BadRequestException(
                  `Yetersiz stok: "${stokItem.stokAdi}" için stokta sadece ${stokItem.adet} adet var, ${dto.birimAdedi} adet talep edildi.`
                );
              }
              // Birim adedi kadar stoktan düş
              console.log('CardService - Stoktan düşülüyor:', dto.birimAdedi, 'adet');
              for (let i = 0; i < dto.birimAdedi; i++) {
                await this.stokService.updateAdet(dto.stockId, 'decrement', tenant_id);
              }
              console.log('CardService - Stoktan düşme tamamlandı');
            } catch (error) {
              console.error('Stoktan düşme hatası:', error);
              throw error; // Hata durumunda kart eklemeyi durdur
            }
          } else {
            console.log('CardService - Bu parça stoktan seçilmemiş, stoktan düşülmeyecek');
          }
        }

        const yapilanlarEntities = yapilanlar.map(dto => {
          const yapilan = new YapilanlarEntity();
          // id'yi çıkar çünkü auto-increment
          yapilan.birimAdedi = dto.birimAdedi;
          yapilan.parcaAdi = dto.parcaAdi;
          yapilan.birimFiyati = dto.birimFiyati;
          yapilan.toplamFiyat = dto.toplamFiyat;
          yapilan.tenant_id = tenant_id;
          yapilan.card = savedCard; // İlişkiyi belirtmek için card referansı ekleniyor
          // Stok bilgilerini kaydet
          yapilan.stockId = dto.stockId || null;
          yapilan.isFromStock = dto.isFromStock || false;
          return yapilan;
        });

        // Yapilanlar'ı direkt kaydet (tenant_id'nin kaybolmaması için)
        await this.yapilanlarRepository.save(yapilanlarEntities);
      }

      const result = await this.databaseRepository.findOne({ where: { card_id: savedCard.card_id }, relations: ["yapilanlar"] });

      // Kart ekleme logunu kaydet
      if (username) {
        try {
          await this.logService.createLog(tenant_id, username, 'card_create', createCardDto.duzenleyen);
        } catch (error) {
          console.error('Kart ekleme log kaydetme hatası:', error);
          // Log hatası kart eklemeyi engellemez
        }
      }

      return result;
    } catch (error) {
      throw error;
    }
  }

  async updateCardYapilanlar(createYapilanlarDtoArray: CreateYapilanlarDto[], card_id: number, tenant_id: number) {

    let card = await this.databaseRepository.findOne({ where: { card_id, tenant_id }, relations: ['yapilanlar'] });

    if (!card) {
      throw new NotFoundException(`Card ID: ${card_id} bulunamadı.`);
    }

    // Create YapilanlarEntity array
    const yapilanlarEntities: YapilanlarEntity[] = createYapilanlarDtoArray.map(dto => {
      const yapilan = new YapilanlarEntity();
      yapilan.birimAdedi = dto.birimAdedi;
      yapilan.parcaAdi = dto.parcaAdi;
      yapilan.birimFiyati = dto.birimFiyati;
      yapilan.toplamFiyat = dto.toplamFiyat;
      yapilan.tenant_id = tenant_id;
      yapilan.card = card; // İlişkiyi belirtmek için card referansı ekleniyor
      return yapilan;
    });

    // Kart ile yapılanları ilişkilendiriyoruz
    card.yapilanlar = yapilanlarEntities;

    await this.databaseRepository.save(card);

    return this.databaseRepository.findOne({ where: { card_id }, relations: ['yapilanlar'] });
  }

  findAll(tenant_id: number) {
    return this.databaseRepository.find({ 
      where: { tenant_id },
      relations: ['yapilanlar'] 
    });
  }

  async findYapilanlarByCardId(card_id: number, tenant_id: number) {
    return this.databaseRepository.findOne({
      where: { card_id, tenant_id },
      relations: ['yapilanlar'],
    });
  }
  
  async update(card_id: number, updateCardDto: any, tenant_id: number, username?: string) {
    let card = await this.databaseRepository.findOne({ where: { card_id, tenant_id } });

    if (!card) {
      throw new NotFoundException(`Card ID: ${card_id} bulunamadı.`);
    }

    // Ödeme durumu güncelleniyor mu kontrol et
    const isPaymentUpdate = updateCardDto.hasOwnProperty('odemeAlindi') && card.odemeAlindi !== updateCardDto.odemeAlindi;

    // Kart bilgilerini güncelleme
    for (let key in updateCardDto) {
      if (updateCardDto.hasOwnProperty(key) && updateCardDto[key] !== undefined) {
        card[key] = updateCardDto[key];
      }
    }

    const savedCard = await this.databaseRepository.save(card);

    // Ödeme durumu güncellemesi için özel log
    if (isPaymentUpdate && username) {
      try {
        await this.logService.createLog(tenant_id, username, 'payment_update');
      } catch (error) {
        console.error('Ödeme durumu güncelleme log kaydetme hatası:', error);
      }
    } else if (username && !isPaymentUpdate) {
      // Diğer düzenlemeler için normal log
      try {
        const duzenleyen = updateCardDto.duzenleyen || null;
        await this.logService.createLog(tenant_id, username, 'card_edit', duzenleyen);
      } catch (error) {
        console.error('Düzenleme log kaydetme hatası:', error);
        // Log hatası güncellemeyi engellemez
      }
    }

    return savedCard;
  }

  async removeAll(tenant_id: number) {
    try {
      const cards = await this.databaseRepository.find({ 
        where: { tenant_id },
        relations: ['yapilanlar'] 
      });

      for (const card of cards) {
        await this.databaseRepository.remove(card);
      }

      // Tüm veriler başarıyla silindi
    } catch (error) {
      throw error;
    }
  }
  
  async removeid(card_id: number, tenant_id: number, username?: string, duzenleyen?: string) {
    const card = await this.databaseRepository.findOne({ 
      where: { card_id, tenant_id }, 
      relations: ['yapilanlar'] 
    });
    if (card) {
      await this.databaseRepository.remove(card);
      
      // Silme logunu kaydet
      if (username) {
        try {
          await this.logService.createLog(tenant_id, username, 'card_delete', duzenleyen);
        } catch (error) {
          console.error('Silme log kaydetme hatası:', error);
          // Log hatası silmeyi engellemez
        }
      }
    } else {
      throw new NotFoundException(`Card with ID ${card_id} not found.`);
    }
  }
}
