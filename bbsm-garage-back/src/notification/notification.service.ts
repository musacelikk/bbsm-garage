import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
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
}
