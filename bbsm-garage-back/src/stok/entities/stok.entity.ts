import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class StokEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'bigint' })
    tenant_id: number;

    @Column()
    stokAdi: string;

    @Column()
    adet: number;

    @Column()
    info: string;

    @Column()
    eklenisTarihi: Date;
    
}
