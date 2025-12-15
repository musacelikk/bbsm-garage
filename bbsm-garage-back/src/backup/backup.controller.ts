import { Controller, Get, Post, UseGuards, Body, Res, Param } from '@nestjs/common';
import { BackupService } from './backup.service';
import { RestoreBackupDto } from './dto/restore-backup.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';
import { Response } from 'express';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createBackup(@TenantId() tenant_id: number, @Res() res: Response) {
    try {
      const backupData = await this.backupService.createBackup(tenant_id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=backup-${tenant_id}-${Date.now()}.json`);
      res.json(backupData);
    } catch (error) {
      res.status(500).json({ message: 'Yedekleme oluşturulamadı', error: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('restore')
  async restoreBackup(@TenantId() tenant_id: number, @Body() backupData: RestoreBackupDto) {
    return this.backupService.restoreBackup(tenant_id, backupData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async listBackups(@TenantId() tenant_id: number) {
    return this.backupService.listBackups(tenant_id);
  }
}
