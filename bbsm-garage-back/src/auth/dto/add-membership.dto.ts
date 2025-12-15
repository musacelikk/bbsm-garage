import { IsNumber, IsOptional, IsDateString } from 'class-validator';

export class AddMembershipDto {
  @IsNumber()
  months: number;

  @IsOptional()
  @IsDateString()
  customDate?: string;
}
