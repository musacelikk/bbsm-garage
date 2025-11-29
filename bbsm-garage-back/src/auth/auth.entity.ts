import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert } from 'typeorm';

@Entity()
export class AuthEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, type: 'bigint' })
    tenant_id: number;

    @Column()
    username: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    firmaAdi: string;

    @Column({ nullable: true })
    yetkiliKisi: string;

    @Column({ nullable: true })
    telefon: string;

    @Column({ nullable: true })
    email: string;

    @Column({ type: 'text', nullable: true })
    adres: string;

    @Column({ nullable: true })
    vergiNo: string;

    @Column({ default: false })
    emailVerified: boolean;

    @Column({ nullable: true })
    verificationToken: string;

    @Column({ type: 'timestamp', nullable: true })
    verificationTokenExpiry: Date;

    @Column({ nullable: true })
    resetToken: string;

    @Column({ type: 'timestamp', nullable: true })
    resetTokenExpiry: Date;

    @Column({ default: false })
    isActive: boolean;

    @Column({ type: 'timestamp', nullable: true })
    membership_start_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    membership_end_date: Date;

    @Column({ type: 'varchar', length: 20, default: 'inactive' })
    membership_status: string;

    @BeforeInsert()
    generateTenantId() {
        if (!this.tenant_id) {
            this.tenant_id = Math.floor(10000000 + Math.random() * 90000000);
        }
    }
}
