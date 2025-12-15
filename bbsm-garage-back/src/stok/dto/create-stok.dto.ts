import { IsString, IsNumber, IsOptional, IsDateString } from 'class-validator';

export class CreateStokDto {

    @IsString()
    stokAdi: string;

    @IsNumber()
    adet: number;

    @IsString()
    info: string;

    @IsOptional()
    @IsDateString()
    eklenisTarihi?: string;

    @IsOptional()
    @IsString()
    kategori?: string;

    @IsOptional()
    @IsNumber()
    minStokSeviyesi?: number;
    
}
