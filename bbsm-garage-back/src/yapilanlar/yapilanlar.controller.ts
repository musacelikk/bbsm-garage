  import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
  import { YapilanlarService } from './yapilanlar.service';
  import { CreateYapilanlarDto } from './dto/create-yapilanlar.dto';
  import { UpdateYapilanlarDto } from './dto/update-yapilanlar.dto';

  @Controller('yapilanlar')
  export class YapilanlarController {
    constructor(private readonly yapilanlarService: YapilanlarService) {}
    
    @Post()
    create(@Body() createYapilanlarDto: CreateYapilanlarDto) {
      return this.yapilanlarService.create(createYapilanlarDto);
    }

    @Get()
    findAll() {
      return this.yapilanlarService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
      return this.yapilanlarService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: number, @Body() updateYapilanlarDto: UpdateYapilanlarDto) {
      return this.yapilanlarService.update(id, updateYapilanlarDto);
    }

    @Delete(':id')
    remove(@Param('id') id: number) {
      return this.yapilanlarService.remove(id);
    }
  }
