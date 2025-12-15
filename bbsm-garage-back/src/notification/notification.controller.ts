import { Controller, Get, Patch, Param, UseGuards, Body, Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationPreferenceDto } from './dto/notification-preference.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';
import { Request } from '@nestjs/common';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@TenantId() tenant_id: number, @Request() req) {
    const username = req.user.username;
    return this.notificationService.findAll(tenant_id, username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @TenantId() tenant_id: number, @Request() req) {
    const username = req.user.username;
    return this.notificationService.markAsRead(+id, tenant_id, username);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  markAllAsRead(@TenantId() tenant_id: number, @Request() req) {
    const username = req.user.username;
    return this.notificationService.markAllAsRead(tenant_id, username);
  }

  @UseGuards(JwtAuthGuard)
  @Get('preferences')
  getPreferences(@TenantId() tenant_id: number, @Request() req) {
    const username = req.user.username;
    return this.notificationService.getPreferences(tenant_id, username);
  }

  @UseGuards(JwtAuthGuard)
  @Post('preferences')
  updatePreferences(@TenantId() tenant_id: number, @Request() req, @Body() preferences: NotificationPreferenceDto) {
    const username = req.user.username;
    return this.notificationService.updatePreferences(tenant_id, username, preferences);
  }
}
