import { CardEntity } from "src/card/entities/card.entity";
import { TeklifEntity } from "src/teklif/entities/teklif.entity";

export class CreateYapilanlarDto {
  // kart: CardEntity;
  // teklif: TeklifEntity;
  card_id : number;
  teklif_id : number;
  birimAdedi: number;
  parcaAdi: string;
  birimFiyati: number;
  toplamFiyat: number;
  id: any;
  }
