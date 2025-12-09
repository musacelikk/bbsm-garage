import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { OneriService } from './oneri.service';
import { CreateOneriDto } from './dto/create-oneri.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';

@Controller('oneri')
export class OneriController {
  constructor(private readonly oneriService: OneriService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createOneriDto: CreateOneriDto, @TenantId() tenant_id: number) {
    return this.oneriService.create(createOneriDto, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@TenantId() tenant_id: number) {
    return this.oneriService.findAll(tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenant_id: number) {
    return this.oneriService.findOne(+id, tenant_id);
  }
}
