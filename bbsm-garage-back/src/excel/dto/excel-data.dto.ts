import { IsObject, IsArray, IsString, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class VehicleInfoDto {
  @IsOptional()
  @IsString()
  firmaAdi?: string;

  @IsOptional()
  @IsString()
  adSoyad?: string;

  @IsOptional()
  @IsString()
  telNo?: string;

  @IsOptional()
  @IsString()
  markaModel?: string;

  @IsOptional()
  @IsString()
  plaka?: string;

  @IsOptional()
  @IsNumber()
  km?: number;

  @IsOptional()
  @IsNumber()
  modelYili?: number;

  @IsOptional()
  @IsString()
  sasi?: string;

  @IsOptional()
  @IsString()
  renk?: string;

  @IsOptional()
  @IsString()
  girisTarihi?: string;

  @IsOptional()
  @IsString()
  notlar?: string;

  @IsOptional()
  @IsString()
  adres?: string;
}

class YapilanlarItemDto {
  @IsNumber()
  birimAdedi: number;

  @IsString()
  parcaAdi: string;

  @IsNumber()
  birimFiyati: number;

  @IsNumber()
  toplamFiyat: number;
}

export class ExcelDataDto {
  @IsObject()
  @ValidateNested()
  @Type(() => VehicleInfoDto)
  vehicleInfo: VehicleInfoDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => YapilanlarItemDto)
  data: YapilanlarItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}
