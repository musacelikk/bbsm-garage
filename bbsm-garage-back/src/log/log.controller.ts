import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { LogService } from './log.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
}

