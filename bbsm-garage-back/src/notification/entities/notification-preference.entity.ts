import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class NotificationPreferenceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  tenant_id: number;

  @Column({ type: 'text' })
  username: string;

  @Column({ type: 'boolean', default: true })
  emailEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  smsEnabled: boolean;

  @Column({ type: 'boolean', default: true })
  oneriApproved: boolean;

  @Column({ type: 'boolean', default: true })
  oneriRejected: boolean;

  @Column({ type: 'boolean', default: true })
  paymentReminder: boolean;

  @Column({ type: 'boolean', default: true })
  maintenanceReminder: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
