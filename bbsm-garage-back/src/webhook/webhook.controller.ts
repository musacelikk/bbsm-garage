import { Controller, Post, Body, Headers, UseGuards, Param } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookRegisterDto } from './dto/webhook-register.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @UseGuards(JwtAuthGuard)
  @Post('register')
  async registerWebhook(@TenantId() tenant_id: number, @Body() webhookData: WebhookRegisterDto) {
    return this.webhookService.registerWebhook(tenant_id, webhookData.url, webhookData.events);
  }

  @UseGuards(JwtAuthGuard)
  @Post('trigger/:event')
  async triggerWebhook(@TenantId() tenant_id: number, @Param('event') event: string, @Body() data: any) {
    return this.webhookService.triggerWebhook(tenant_id, event, data);
  }
}
