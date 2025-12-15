import { IsString, IsOptional } from 'class-validator';

export class MembershipRequestResponseDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
