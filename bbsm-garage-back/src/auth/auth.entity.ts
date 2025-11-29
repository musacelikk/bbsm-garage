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

    @BeforeInsert()
    generateTenantId() {
        if (!this.tenant_id) {
            // 8 haneli rastgele numeric ID: 10000000 - 99999999
            this.tenant_id = Math.floor(10000000 + Math.random() * 90000000);
        }
    }
}
