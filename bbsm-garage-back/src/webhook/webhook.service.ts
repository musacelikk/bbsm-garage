import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class WebhookService {
  private webhooks: Map<number, Array<{ url: string; events: string[] }>> = new Map();

  constructor(private readonly httpService: HttpService) {}

  async registerWebhook(tenant_id: number, url: string, events: string[]) {
    if (!this.webhooks.has(tenant_id)) {
      this.webhooks.set(tenant_id, []);
    }
    this.webhooks.get(tenant_id)?.push({ url, events });
    return { message: 'Webhook kaydedildi', url, events };
  }

  async triggerWebhook(tenant_id: number, event: string, data: any) {
    const tenantWebhooks = this.webhooks.get(tenant_id) || [];
    const relevantWebhooks = tenantWebhooks.filter(wh => wh.events.includes(event));

    const results = await Promise.allSettled(
      relevantWebhooks.map(webhook =>
        firstValueFrom(
          this.httpService.post(webhook.url, { event, data, tenant_id, timestamp: new Date().toISOString() })
        )
      )
    );

    return {
      triggered: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
    };
  }
}
