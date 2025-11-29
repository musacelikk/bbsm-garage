import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDuzenleyenToLog1700000000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn(
            'log_entity',
            new TableColumn({
                name: 'duzenleyen',
                type: 'text',
                isNullable: true,
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn('log_entity', 'duzenleyen');
    }
}

