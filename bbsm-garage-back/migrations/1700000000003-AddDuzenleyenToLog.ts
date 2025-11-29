import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDuzenleyenToLog1700000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('log_entity');
        const hasColumn = table?.findColumnByName('duzenleyen');
        
        if (!hasColumn) {
            await queryRunner.addColumn(
                'log_entity',
                new TableColumn({
                    name: 'duzenleyen',
                    type: 'text',
                    isNullable: true,
                }),
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('log_entity');
        const hasColumn = table?.findColumnByName('duzenleyen');
        
        if (hasColumn) {
            await queryRunner.dropColumn('log_entity', 'duzenleyen');
        }
    }
}

