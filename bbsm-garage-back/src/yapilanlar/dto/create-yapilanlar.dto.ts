import { CardEntity } from "src/card/entities/card.entity";
import { TeklifEntity } from "src/teklif/entities/teklif.entity";
import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateYapilanlarDto {
  // kart: CardEntity;
  // teklif: TeklifEntity;
  
  @IsOptional()
  @IsNumber()
  card_id?: number;
  
  @IsOptional()
  @IsNumber()
  teklif_id?: number;
  
  @IsNumber()
  birimAdedi: number;
  
  @IsString()
  parcaAdi: string;
  
  @IsNumber()
  birimFiyati: number;
  
  @IsNumber()
  toplamFiyat: number;
  
  @IsOptional()
  id?: any;

  @IsOptional()
  @IsNumber()
  stockId?: number; // Stoktan seçildiyse stok ID'si

  @IsOptional()
  isFromStock?: boolean; // Stoktan mı seçildi flag'i
  }
