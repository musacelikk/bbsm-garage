import { PartialType } from '@nestjs/mapped-types';
import { CreateYapilanlarDto } from './create-yapilanlar.dto';

export class UpdateYapilanlarDto extends PartialType(CreateYapilanlarDto) {}
