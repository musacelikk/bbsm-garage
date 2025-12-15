import { IsNumber, IsNotEmpty } from 'class-validator';

export class SelectMembershipPlanDto {
  @IsNumber()
  @IsNotEmpty()
  months: number;
}
