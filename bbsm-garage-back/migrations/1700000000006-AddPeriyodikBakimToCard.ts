import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPeriyodikBakimToCard1700000000006 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('card_entity');
        
        if (table) {
            const hasPeriyodikBakim = table.findColumnByName('periyodikBakim');
            
            if (!hasPeriyodikBakim) {
                await queryRunner.addColumn(
                    'card_entity',
                    new TableColumn({
                        name: 'periyodikBakim',
                        type: 'boolean',
                        default: false,
                    }),
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('card_entity');
        
        if (table) {
            const hasPeriyodikBakim = table.findColumnByName('periyodikBakim');
            
            if (hasPeriyodikBakim) {
                await queryRunner.dropColumn('card_entity', 'periyodikBakim');
            }
        }
    }
}

