import { IsString, IsArray, IsUrl } from 'class-validator';

export class WebhookRegisterDto {
  @IsUrl()
  url: string;

  @IsArray()
  @IsString({ each: true })
  events: string[];
}
