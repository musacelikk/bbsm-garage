import { YapilanlarEntity } from 'src/yapilanlar/entities/yapilanlar.entity';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn } from 'typeorm';

@Entity()
export class CardEntity {
  @PrimaryGeneratedColumn()
  card_id: number;

  @Column({ type: 'bigint' })
  tenant_id: number;

  @Column({ type: 'text', nullable: true })
  adSoyad: string;

  @Column({ type: 'text', nullable: true })
  telNo: string;

  @Column({ type: 'text', nullable: true })
  markaModel: string;

  @Column({ type: 'text', nullable: true })
  plaka: string;

  @Column({ type: 'int', nullable: true })
  km: number;

  @Column({ type: 'int', nullable: true })
  modelYili: number;

  @Column({ type: 'text', nullable: true })
  sasi: string;

  @Column({ type: 'text', nullable: true })
  renk: string;

  @Column({ type: 'text', nullable: true })
  girisTarihi: string;

  @Column({ type: 'text', nullable: true })
  notlar: string;
  

  @Column({ type: 'text', nullable: true })
  adres: string;

  @OneToMany(() => YapilanlarEntity, yapilan => yapilan.card ,{ nullable: true , cascade: true, onDelete: 'CASCADE' })
  yapilanlar: YapilanlarEntity[];

}


