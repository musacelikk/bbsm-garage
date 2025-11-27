import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CardEntity } from '../../card/entities/card.entity'; // Kart entity dosyasının yolu
import { TeklifEntity } from '../../teklif/entities/teklif.entity'; // Teklif entity dosyasının yolu

@Entity('yapilanlar')
export class YapilanlarEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'bigint' })
    tenant_id: number;

    @ManyToOne(() => CardEntity, card => card.yapilanlar, { nullable: true , onDelete: 'CASCADE'  })
    @JoinColumn({ name: 'card_id' })
    card: CardEntity;

    @ManyToOne(() => TeklifEntity, teklif => teklif.yapilanlar, { nullable: true , onDelete: 'CASCADE' })
    @JoinColumn({ name: 'teklif_id' })
    teklif: TeklifEntity;

    @Column({ type: 'int', nullable: true })
    birimAdedi: number;    

    @Column({ nullable: true })
    parcaAdi: string;

    @Column({ type: 'int', nullable: true })
    birimFiyati: number;    

    @Column({ type: 'int', nullable: true })
    toplamFiyat: number;
}
