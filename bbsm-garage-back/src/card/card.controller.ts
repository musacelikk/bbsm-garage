import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { CreateYapilanlarDto } from 'src/yapilanlar/dto/create-yapilanlar.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';

@Controller('card')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCardDto: CreateCardDto, @Request() req, @TenantId() tenant_id: number) {
    // Düzenleyen alanı zorunlu kontrolü
    if (!createCardDto.duzenleyen || createCardDto.duzenleyen.trim() === '') {
      throw new BadRequestException('Düzenleyen alanı zorunludur');
    }

    const cardData: CreateCardDto = {
      ...createCardDto,
      km: createCardDto.km !== null ? createCardDto.km : 0,
      modelYili: createCardDto.modelYili !== null ? createCardDto.modelYili : 0,
      adSoyad: createCardDto.adSoyad || "Tanımsız",
      markaModel: createCardDto.markaModel || "Tanımsız",
      plaka: createCardDto.plaka || "Tanımsız",
      sasi: createCardDto.sasi || "Tanımsız",
      girisTarihi: createCardDto.girisTarihi || "Tanımsız",
      notlar: createCardDto.notlar || "",
      adres: createCardDto.adres || "",
      odemeAlindi: createCardDto.odemeAlindi !== undefined ? createCardDto.odemeAlindi : false,
      periyodikBakim: createCardDto.periyodikBakim !== undefined 
        ? (createCardDto.periyodikBakim === true || String(createCardDto.periyodikBakim) === 'true' || Number(createCardDto.periyodikBakim) === 1)
        : false,
      duzenleyen: createCardDto.duzenleyen.trim(),
      yapilanlar: createCardDto.yapilanlar || [],
    };
    
    const username = req.user?.username;
    return this.cardService.create(cardData, tenant_id, username);
  }  

  @UseGuards(JwtAuthGuard)
  @Get(':card_id/yapilanlar')
  findYapilanlarByCardId(@Param('card_id') card_id: number, @TenantId() tenant_id: number) {
    return this.cardService.findYapilanlarByCardId(card_id, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@TenantId() tenant_id: number) {
    return this.cardService.findAll(tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-card/:card_id')
  updateCardYapilanlar(@Body() updateYapilan: CreateYapilanlarDto[], @Param('card_id') card_id: number, @TenantId() tenant_id: number) {
    return this.cardService.updateCardYapilanlar(updateYapilan, +card_id, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':card_id')
  update(@Param('card_id') card_id: string, @Body() updateCardDto: any, @Request() req, @TenantId() tenant_id: number) {
    // Düzenleyen alanı zorunlu kontrolü (güncelleme sırasında)
    if (updateCardDto.duzenleyen !== undefined && (!updateCardDto.duzenleyen || updateCardDto.duzenleyen.trim() === '')) {
      throw new BadRequestException('Düzenleyen alanı zorunludur');
    }
    
    // Eğer duzenleyen gönderildiyse trim yap
    if (updateCardDto.duzenleyen) {
      updateCardDto.duzenleyen = updateCardDto.duzenleyen.trim();
    }
    
    const username = req.user?.username;
    return this.cardService.update(parseInt(card_id, 10), updateCardDto, tenant_id, username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':card_id/yapilanlar')
  updateYapilanlar(@Param('card_id') card_id: number, @Body() yapilanlar: CreateYapilanlarDto[], @TenantId() tenant_id: number) {
    if (!Array.isArray(yapilanlar)) {
      throw new BadRequestException('Yapilanlar bir dizi olmalıdır');
    }
    return this.cardService.updateCardYapilanlar(yapilanlar, card_id, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("delAll")
  removeAll(@TenantId() tenant_id: number) {
    return this.cardService.removeAll(tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':card_id')
  remove(@Param('card_id') card_id: string, @Body() body: { duzenleyen?: string }, @Request() req, @TenantId() tenant_id: number) {
    const username = req.user?.username;
    const duzenleyen = body?.duzenleyen || null;
    return this.cardService.removeid(parseInt(card_id, 10), tenant_id, username, duzenleyen);
  }
}
