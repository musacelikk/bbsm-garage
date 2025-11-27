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

    @BeforeInsert()
    generateTenantId() {
        if (!this.tenant_id) {
            // 8 haneli rastgele numeric ID: 10000000 - 99999999
            this.tenant_id = Math.floor(10000000 + Math.random() * 90000000);
        }
    }
}
