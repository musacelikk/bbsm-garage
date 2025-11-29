import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOdemeAlindi1700000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const cardTable = await queryRunner.getTable('card_entity');
        const hasOdemeAlindi = cardTable?.findColumnByName('odemeAlindi');
        
        if (!hasOdemeAlindi) {
            await queryRunner.addColumn('card_entity', new TableColumn({
                name: 'odemeAlindi',
                type: 'boolean',
                default: false,
                isNullable: false,
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const cardTable = await queryRunner.getTable('card_entity');
        const hasOdemeAlindi = cardTable?.findColumnByName('odemeAlindi');
        
        if (hasOdemeAlindi) {
            await queryRunner.dropColumn('card_entity', 'odemeAlindi');
        }
    }
}

