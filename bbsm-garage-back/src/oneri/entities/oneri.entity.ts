import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class OneriEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  tenant_id: number;

  @Column({ type: 'text' })
  username: string;

  @Column({ type: 'text' })
  oneriBaslik: string;

  @Column({ type: 'text' })
  sorunTanimi: string;

  @Column({ type: 'text' })
  mevcutCozum: string;

  @Column({ type: 'jsonb', nullable: true })
  etkiAlani: string[];

  @Column({ type: 'text', nullable: true })
  ekNot: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  tarih: Date;

  @Column({ type: 'varchar', default: 'pending' })
  status: string; // 'pending', 'approved', 'rejected'

  @Column({ type: 'text', nullable: true })
  admin_response: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewed_at: Date;
}
