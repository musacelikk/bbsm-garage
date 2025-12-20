import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddActionDetailToLog1700000000007 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('log_entity');
        const hasColumn = table?.findColumnByName('action_detail');
        
        if (!hasColumn) {
            await queryRunner.addColumn(
                'log_entity',
                new TableColumn({
                    name: 'action_detail',
                    type: 'text',
                    isNullable: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('log_entity');
        const hasColumn = table?.findColumnByName('action_detail');
        
        if (hasColumn) {
            await queryRunner.dropColumn('log_entity', 'action_detail');
        }
    }
}
