import { IsObject, IsOptional } from 'class-validator';

export class RestoreBackupDto {
  @IsObject()
  @IsOptional()
  cards?: any[];

  @IsObject()
  @IsOptional()
  teklifler?: any[];

  @IsObject()
  @IsOptional()
  stok?: any[];

  @IsObject()
  @IsOptional()
  yapilanlar?: any[];

  @IsObject()
  @IsOptional()
  logs?: any[];
}
