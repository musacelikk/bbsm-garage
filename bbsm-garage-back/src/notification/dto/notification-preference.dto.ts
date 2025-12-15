import { IsBoolean, IsOptional } from 'class-validator';

export class NotificationPreferenceDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  oneriApproved?: boolean;

  @IsOptional()
  @IsBoolean()
  oneriRejected?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentReminder?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceReminder?: boolean;
}
