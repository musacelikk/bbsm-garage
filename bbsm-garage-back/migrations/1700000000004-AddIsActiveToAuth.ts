import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddIsActiveToAuth1700000000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('auth_entity');
        const hasColumn = table?.findColumnByName('isActive');
        
        if (!hasColumn) {
            await queryRunner.addColumn(
                'auth_entity',
                new TableColumn({
                    name: 'isActive',
                    type: 'boolean',
                    default: false,
                }),
            );
            
            // Mevcut kullanıcıları aktif yap (opsiyonel - isterseniz false bırakabilirsiniz)
            await queryRunner.query(`UPDATE auth_entity SET "isActive" = true WHERE "isActive" IS NULL`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('auth_entity');
        const hasColumn = table?.findColumnByName('isActive');
        
        if (hasColumn) {
            await queryRunner.dropColumn('auth_entity', 'isActive');
        }
    }
}

