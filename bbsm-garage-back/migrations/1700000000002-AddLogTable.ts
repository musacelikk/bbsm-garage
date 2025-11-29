import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

export class AddLogTable1700000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Log tablosunu oluştur
        const logTable = await queryRunner.getTable('log_entity');
        
        if (!logTable) {
            await queryRunner.createTable(
                new Table({
                    name: 'log_entity',
                    columns: [
                        {
                            name: 'id',
                            type: 'int',
                            isPrimary: true,
                            isGenerated: true,
                            generationStrategy: 'increment',
                        },
                        {
                            name: 'tenant_id',
                            type: 'bigint',
                            isNullable: false,
                        },
                        {
                            name: 'username',
                            type: 'varchar',
                            isNullable: false,
                        },
                        {
                            name: 'action',
                            type: 'varchar',
                            length: '20',
                            isNullable: false,
                        },
                        {
                            name: 'timestamp',
                            type: 'timestamp',
                            default: 'CURRENT_TIMESTAMP',
                            isNullable: false,
                        },
                    ],
                }),
                true
            );

            // Index ekle (performans için)
            await queryRunner.createIndex(
                'log_entity',
                new TableIndex({
                    name: 'IDX_LOG_TENANT_ID',
                    columnNames: ['tenant_id'],
                })
            );

            await queryRunner.createIndex(
                'log_entity',
                new TableIndex({
                    name: 'IDX_LOG_TIMESTAMP',
                    columnNames: ['timestamp'],
                })
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const logTable = await queryRunner.getTable('log_entity');
        
        if (logTable) {
            await queryRunner.dropTable('log_entity');
        }
    }
}

