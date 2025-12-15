import { Controller, Post, UseGuards, Body, Param } from '@nestjs/common';
import { ArchiveService } from './archive.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';

@Controller('archive')
export class ArchiveController {
  constructor(private readonly archiveService: ArchiveService) {}

  @UseGuards(JwtAuthGuard)
  @Post('cards/:daysOld')
  async archiveCards(@TenantId() tenant_id: number, @Param('daysOld') daysOld: string) {
    return this.archiveService.archiveOldCards(tenant_id, parseInt(daysOld, 10));
  }

  @UseGuards(JwtAuthGuard)
  @Post('logs/:daysOld')
  async cleanLogs(@TenantId() tenant_id: number, @Param('daysOld') daysOld: string) {
    return this.archiveService.cleanOldLogs(tenant_id, parseInt(daysOld, 10));
  }
}
