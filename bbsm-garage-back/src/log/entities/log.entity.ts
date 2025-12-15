import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('log_entity')
export class LogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  tenant_id: number;

  @Column()
  username: string;

  @Column({ type: 'varchar', length: 20 })
  action: string; // 'login', 'logout', 'card_create', 'card_edit', 'card_delete'

  @Column({ type: 'text', nullable: true })
  duzenleyen: string; // Kart işlemleri için düzenleyen bilgisi

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip_address: string; // IP adresi

  @Column({ type: 'text', nullable: true })
  user_agent: string; // User agent

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}

