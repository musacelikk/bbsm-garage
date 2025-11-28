import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { YapilanlarService } from './yapilanlar.service';
import { CreateYapilanlarDto } from './dto/create-yapilanlar.dto';
import { UpdateYapilanlarDto } from './dto/update-yapilanlar.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';

@Controller('yapilanlar')
export class YapilanlarController {
  constructor(private readonly yapilanlarService: YapilanlarService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createYapilanlarDto: CreateYapilanlarDto, @TenantId() tenant_id: number) {
    return this.yapilanlarService.create(createYapilanlarDto, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@TenantId() tenant_id: number) {
    return this.yapilanlarService.findAll(tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: number, @TenantId() tenant_id: number) {
    return this.yapilanlarService.findOne(id, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateYapilanlarDto: UpdateYapilanlarDto, @TenantId() tenant_id: number) {
    return this.yapilanlarService.update(id, updateYapilanlarDto, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: number, @TenantId() tenant_id: number) {
    return this.yapilanlarService.remove(id, tenant_id);
  }
}
