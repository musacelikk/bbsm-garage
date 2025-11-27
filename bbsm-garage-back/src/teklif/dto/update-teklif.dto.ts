import { PartialType } from '@nestjs/mapped-types';
import { CreateTeklifDto } from './create-teklif.dto';

export class UpdateTeklifDto extends PartialType(CreateTeklifDto) {}
