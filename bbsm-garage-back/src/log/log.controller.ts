import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { LogService } from './log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';

@Controller('log')
export class LogController {
  constructor(private readonly logService: LogService) {}

  @UseGuards(JwtAuthGuard)
  @Get('son-hareketler')
  async getSonHareketler(@Request() req, @Query('limit') limit?: number) {
    const tenantId = req.user.tenant_id;
    const logs = await this.logService.getLogsByTenant(tenantId, limit ? parseInt(limit.toString()) : 100);
    return logs;
  }

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createLog(
    @TenantId() tenant_id: number,
    @Request() req,
    @Body() body: { action: string; duzenleyen?: string }
  ) {
    const username = req.user.username;
    await this.logService.createLog(tenant_id, username, body.action, body.duzenleyen);
    return { success: true };
  }
}

