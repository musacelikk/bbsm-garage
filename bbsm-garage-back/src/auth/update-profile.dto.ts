import { IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    firmaAdi?: string;

    @IsOptional()
    @IsString()
    yetkiliKisi?: string;

    @IsOptional()
    @IsString()
    telefon?: string;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    adres?: string;

    @IsOptional()
    @IsString()
    vergiNo?: string;
}

