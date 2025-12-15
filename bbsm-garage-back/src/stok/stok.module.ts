import { Module } from '@nestjs/common';
import { StokService } from './stok.service';
import { StokController } from './stok.controller';
import { StokEntity } from './entities/stok.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogModule } from '../log/log.module';

@Module({
  imports: [TypeOrmModule.forFeature([StokEntity]), LogModule],
  controllers: [StokController],
  providers: [StokService],
})
export class StokModule {}
