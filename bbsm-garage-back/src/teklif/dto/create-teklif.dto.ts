import { CreateYapilanlarDto } from "src/yapilanlar/dto/create-yapilanlar.dto";
import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTeklifDto {
    
    @IsOptional()
    @IsNumber()
    teklif_id? : number;

    @IsString()
    adSoyad: string;

    @IsString()
    telNo: string;

    @IsString()
    markaModel: string;

    @IsString()
    plaka: string;

    @IsOptional()
    @IsNumber()
    km?: number;

    @IsOptional()
    @IsNumber()
    modelYili?: number;

    @IsString()
    sasi: string;

    @IsString()
    renk: string;

    @IsString()
    girisTarihi: string;

    @IsString()
    notlar: string;

    @IsString()
    adres: string;

    @IsOptional()
    @IsBoolean()
    odemeAlindi?: boolean;

    @IsOptional()
    @IsBoolean()
    periyodikBakim?: boolean;

    @IsOptional()
    @IsString()
    duzenleyen?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateYapilanlarDto)
    yapilanlar?: CreateYapilanlarDto[];
}
