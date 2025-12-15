import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OneriEntity } from './entities/oneri.entity';
import { CreateOneriDto } from './dto/create-oneri.dto';
import { NotificationEntity } from '../notification/entities/notification.entity';

@Injectable()
export class OneriService {
  constructor(
    @InjectRepository(OneriEntity)
    private oneriRepository: Repository<OneriEntity>,
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
  ) {}

  async create(createOneriDto: CreateOneriDto, tenant_id: number) {
    const oneriData: any = {
      ...createOneriDto,
      tenant_id,
      status: 'pending',
    };
    
    // Tarih string ise Date'e dönüştür, yoksa undefined bırak (Entity'de default var)
    if (createOneriDto.tarih) {
      oneriData.tarih = new Date(createOneriDto.tarih);
    }
    
    const oneri = this.oneriRepository.create(oneriData);
    return await this.oneriRepository.save(oneri);
  }

  async findAll(tenant_id?: number) {
    if (tenant_id) {
      return await this.oneriRepository.find({
        where: { tenant_id },
        order: { tarih: 'DESC' },
      });
    }
    // Admin için tüm önerileri getir
    return await this.oneriRepository.find({
      order: { tarih: 'DESC' },
    });
  }

  async findOne(id: number, tenant_id?: number) {
    const where: any = { id };
    if (tenant_id) {
      where.tenant_id = tenant_id;
    }
    return await this.oneriRepository.findOne({ where });
  }

  async approve(id: number, adminResponse?: string) {
    const oneri = await this.oneriRepository.findOne({ where: { id } });
    if (!oneri) {
      throw new Error('Öneri bulunamadı');
    }

    oneri.status = 'approved';
    oneri.admin_response = adminResponse || 'Öneriniz onaylandı. Teşekkür ederiz!';
    oneri.reviewed_at = new Date();

    await this.oneriRepository.save(oneri);

    // Bildirim oluştur
    const notification = this.notificationRepository.create({
      tenant_id: oneri.tenant_id,
      username: oneri.username,
      title: 'Öneriniz Onaylandı! 🎉',
      message: `"${oneri.oneriBaslik}" başlıklı öneriniz onaylandı.`,
      content: oneri.admin_response,
      type: 'oneri_approved',
    });
    await this.notificationRepository.save(notification);

    return oneri;
  }

  async reject(id: number, adminResponse?: string) {
    const oneri = await this.oneriRepository.findOne({ where: { id } });
    if (!oneri) {
      throw new Error('Öneri bulunamadı');
    }

    oneri.status = 'rejected';
    oneri.admin_response = adminResponse || 'Öneriniz incelendi ancak şu an için uygulanamaz.';
    oneri.reviewed_at = new Date();

    await this.oneriRepository.save(oneri);

    // Bildirim oluştur
    const notification = this.notificationRepository.create({
      tenant_id: oneri.tenant_id,
      username: oneri.username,
      title: 'Öneriniz Değerlendirildi',
      message: `"${oneri.oneriBaslik}" başlıklı öneriniz değerlendirildi.`,
      content: oneri.admin_response,
      type: 'oneri_rejected',
    });
    await this.notificationRepository.save(notification);

    return oneri;
  }
}
