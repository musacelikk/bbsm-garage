import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AuthEntity } from './auth.entity';

@Entity('membership_request')
export class MembershipRequestEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'int' })
    user_id: number;

    @ManyToOne(() => AuthEntity)
    @JoinColumn({ name: 'user_id' })
    user: AuthEntity;

    @Column()
    username: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    months: number;

    @Column({ type: 'varchar', length: 20, default: 'pending' })
    status: string; // pending, approved, rejected

    @Column({ type: 'text', nullable: true })
    admin_response: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}

