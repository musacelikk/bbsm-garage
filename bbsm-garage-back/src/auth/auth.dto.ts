import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AuthDto {

    @IsString()
    @IsNotEmpty()
    public username: string;

    @IsString()
    @IsNotEmpty()
    public password: string;

    @IsString()
    @IsOptional()
    public firmaAdi?: string;

    @IsString()
    @IsOptional()
    public yetkiliKisi?: string;

    @IsString()
    @IsOptional()
    public telefon?: string;

    @IsString()
    @IsOptional()
    public email?: string;

    @IsString()
    @IsOptional()
    public adres?: string;

    @IsString()
    @IsOptional()
    public vergiNo?: string;

}
