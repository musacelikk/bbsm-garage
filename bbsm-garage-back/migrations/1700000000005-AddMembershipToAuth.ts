import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddMembershipToAuth1700000000005 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('auth_entity');
        
        if (table) {
            const hasStartDate = table.findColumnByName('membership_start_date');
            const hasEndDate = table.findColumnByName('membership_end_date');
            const hasStatus = table.findColumnByName('membership_status');
            
            if (!hasStartDate) {
                await queryRunner.addColumn(
                    'auth_entity',
                    new TableColumn({
                        name: 'membership_start_date',
                        type: 'timestamp',
                        isNullable: true,
                    }),
                );
            }
            
            if (!hasEndDate) {
                await queryRunner.addColumn(
                    'auth_entity',
                    new TableColumn({
                        name: 'membership_end_date',
                        type: 'timestamp',
                        isNullable: true,
                    }),
                );
            }
            
            if (!hasStatus) {
                await queryRunner.addColumn(
                    'auth_entity',
                    new TableColumn({
                        name: 'membership_status',
                        type: 'varchar',
                        length: '20',
                        default: "'inactive'",
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('auth_entity');
        
        if (table) {
            const hasStartDate = table.findColumnByName('membership_start_date');
            const hasEndDate = table.findColumnByName('membership_end_date');
            const hasStatus = table.findColumnByName('membership_status');
            
            if (hasStartDate) {
                await queryRunner.dropColumn('auth_entity', 'membership_start_date');
            }
            
            if (hasEndDate) {
                await queryRunner.dropColumn('auth_entity', 'membership_end_date');
            }
            
            if (hasStatus) {
                await queryRunner.dropColumn('auth_entity', 'membership_status');
            }
        }
    }
}

