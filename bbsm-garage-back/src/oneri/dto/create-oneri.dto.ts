import { IsString, IsArray, IsOptional, IsDateString } from 'class-validator';

export class CreateOneriDto {
  @IsString()
  oneriBaslik: string;

  @IsString()
  sorunTanimi: string;

  @IsString()
  mevcutCozum: string;

  @IsArray()
  @IsString({ each: true })
  etkiAlani: string[];

  @IsOptional()
  @IsString()
  ekNot?: string;

  @IsString()
  username: string;

  @IsOptional()
  @IsDateString()
  tarih?: string;
}
