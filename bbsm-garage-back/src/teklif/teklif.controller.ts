import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, UseGuards } from '@nestjs/common';
import { TeklifService } from './teklif.service';
import { CreateTeklifDto } from './dto/create-teklif.dto';
import { UpdateTeklifDto } from './dto/update-teklif.dto';
import { UpdateYapilanlarDto } from '../yapilanlar/dto/update-yapilanlar.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';

@Controller('teklif')
export class TeklifController {
  constructor(private readonly teklifService: TeklifService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createTeklifDto: CreateTeklifDto, @TenantId() tenant_id: number) {
    if (isNaN(createTeklifDto.km)) {
      throw new BadRequestException('km için geçersiz integer değeri');
    }
    if (isNaN(createTeklifDto.modelYili)) {
      throw new BadRequestException('model yılı için geçersiz integer değeri');
    }
    return this.teklifService.create(createTeklifDto, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@TenantId() tenant_id: number) {
    return this.teklifService.findAll(tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenant_id: number) {
    return this.teklifService.findOne(+id, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeklifDto: UpdateTeklifDto, @TenantId() tenant_id: number) {
    return this.teklifService.update(+id, updateTeklifDto, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/yapilanlar')
  updateYapilanlar(@Param('id') id: string, @Body() updateYapilanlarDto: UpdateYapilanlarDto[], @TenantId() tenant_id: number) {
    return this.teklifService.updateYapilanlar(+id, updateYapilanlarDto, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @TenantId() tenant_id: number) {
    return this.teklifService.remove(+id, tenant_id);
  }
}
