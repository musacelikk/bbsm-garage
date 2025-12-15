import { IsString, IsOptional } from 'class-validator';

export class AdminResponseDto {
  @IsOptional()
  @IsString()
  adminResponse?: string;
}
