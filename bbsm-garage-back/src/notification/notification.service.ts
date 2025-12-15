import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';
import { NotificationPreferenceEntity } from './entities/notification-preference.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationPreferenceEntity)
    private preferenceRepository: Repository<NotificationPreferenceEntity>,
  ) {}

  async findAll(tenant_id: number, username: string) {
    return await this.notificationRepository.find({
      where: { tenant_id, username },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: number, tenant_id: number, username: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, tenant_id, username },
    });
    if (notification) {
      notification.isRead = true;
      return await this.notificationRepository.save(notification);
    }
    return null;
  }

  async markAllAsRead(tenant_id: number, username: string) {
    await this.notificationRepository.update(
      { tenant_id, username, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }

  async getPreferences(tenant_id: number, username: string) {
    let preference = await this.preferenceRepository.findOne({
      where: { tenant_id, username },
    });
    if (!preference) {
      preference = this.preferenceRepository.create({
        tenant_id,
        username,
        emailEnabled: true,
        smsEnabled: false,
        oneriApproved: true,
        oneriRejected: true,
        paymentReminder: true,
        maintenanceReminder: true,
      });
      await this.preferenceRepository.save(preference);
    }
    return preference;
  }

  async updatePreferences(tenant_id: number, username: string, preferences: Partial<NotificationPreferenceEntity>) {
    let preference = await this.preferenceRepository.findOne({
      where: { tenant_id, username },
    });
    if (!preference) {
      preference = this.preferenceRepository.create({
        tenant_id,
        username,
        ...preferences,
      });
    } else {
      Object.assign(preference, preferences);
      preference.updatedAt = new Date();
    }
    return await this.preferenceRepository.save(preference);
  }
}
