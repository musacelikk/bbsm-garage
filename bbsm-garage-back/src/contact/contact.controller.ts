import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  async create(@Body() createContactDto: CreateContactDto) {
    try {
      return await this.contactService.create(createContactDto);
    } catch (error) {
      console.error('Contact mesaj gönderme hatası:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Mesaj gönderilirken bir hata oluştu. Lütfen tekrar deneyin.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

