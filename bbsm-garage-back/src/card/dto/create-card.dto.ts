import { CreateYapilanlarDto } from "src/yapilanlar/dto/create-yapilanlar.dto";

export class CreateCardDto {

    card_id : number;
    adSoyad: string;
    telNo: string;
    markaModel: string;
    plaka: string;
    km: number;
    modelYili: number;
    sasi: string;
    renk: string;
    girisTarihi: string;
    notlar: string;
    adres: string;
    yapilanlar: CreateYapilanlarDto[];

  }
  