import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../notification/entities/notification.entity';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
  ) {}

  async create(createContactDto: CreateContactDto) {
    try {
      // Validasyon kontrolü
      if (!createContactDto.name || !createContactDto.email || !createContactDto.subject || !createContactDto.message) {
        throw new Error('Tüm alanlar doldurulmalıdır.');
      }

      // Admin kullanıcısına bildirim oluştur
      // Admin: tenant_id = 0, username = 'musacelik'
      const notification = this.notificationRepository.create({
        tenant_id: 0, // Admin tenant_id
        username: 'musacelik', // Admin username
        title: `Yeni İletişim Mesajı: ${createContactDto.subject}`,
        message: `${createContactDto.name} (${createContactDto.email}) size bir mesaj gönderdi.`,
        content: `Konu: ${createContactDto.subject}\n\nMesaj:\n${createContactDto.message}`,
        type: 'contact_message',
        isRead: false,
      });

      await this.notificationRepository.save(notification);

      return {
        success: true,
        message: 'Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
      };
    } catch (error) {
      console.error('Contact service hatası:', error);
      throw error;
    }
  }
}

