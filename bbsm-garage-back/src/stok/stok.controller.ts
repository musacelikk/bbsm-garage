import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StokService } from './stok.service';
import { CreateStokDto } from './dto/create-stok.dto';
import { UpdateStokDto } from './dto/update-stok.dto';
import { StokEntity } from './entities/stok.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TenantId } from '../auth/tenant.decorator';

@Controller('stok')
export class StokController {
  constructor(private readonly stokService: StokService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createStokDto: CreateStokDto, @TenantId() tenant_id: number) {
    return this.stokService.create(createStokDto, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@TenantId() tenant_id: number) {
    return this.stokService.findAll(tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenant_id: number) {
    return this.stokService.findOne(+id, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStokDto: UpdateStokDto, @TenantId() tenant_id: number) {
    return this.stokService.update(+id, updateStokDto, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete("delAll") 
  removeAll(@TenantId() tenant_id: number) {
    return this.stokService.removeAll(tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @TenantId() tenant_id: number) {
    return this.stokService.remove(+id, tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/adet/:operation')
  updateAdet(@Param('id') id: string, @Param('operation') operation: 'increment' | 'decrement', @TenantId() tenant_id: number) {
    return this.stokService.updateAdet(+id, operation, tenant_id);
  }
}
