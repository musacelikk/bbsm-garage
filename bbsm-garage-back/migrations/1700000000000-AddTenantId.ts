import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTenantId1700000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. AuthEntity'ye tenant_id ekle (eğer yoksa)
        const authTable = await queryRunner.getTable('auth_entity');
        const authHasTenantId = authTable?.findColumnByName('tenant_id');
        
        if (!authHasTenantId) {
            await queryRunner.addColumn('auth_entity', new TableColumn({
                name: 'tenant_id',
                type: 'bigint',
                isUnique: false, // Önce unique değil, sonra yapacağız
                isNullable: true,
            }));
        }

        // 2. Mevcut auth kayıtlarına rastgele 8 haneli tenant_id ata
        const authRecords = await queryRunner.query('SELECT id, tenant_id FROM auth_entity WHERE tenant_id IS NULL');
        for (const record of authRecords) {
            let randomTenantId: number;
            let isUnique = false;
            // Benzersiz tenant_id oluştur
            while (!isUnique) {
                randomTenantId = Math.floor(10000000 + Math.random() * 90000000);
                const existing = await queryRunner.query(
                    `SELECT id FROM auth_entity WHERE tenant_id = ${randomTenantId}`
                );
                if (existing.length === 0) {
                    isUnique = true;
                }
            }
            await queryRunner.query(
                `UPDATE auth_entity SET tenant_id = ${randomTenantId} WHERE id = ${record.id}`
            );
        }

        // 3. AuthEntity tenant_id'yi NOT NULL ve UNIQUE yap (eğer henüz değilse)
        const authTableAfter = await queryRunner.getTable('auth_entity');
        const authTenantIdColumn = authTableAfter?.findColumnByName('tenant_id');
        if (authTenantIdColumn && authTenantIdColumn.isNullable) {
            // Önce unique constraint ekle (eğer yoksa)
            const uniqueConstraintExists = await queryRunner.query(`
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'auth_entity' 
                AND constraint_type = 'UNIQUE' 
                AND constraint_name LIKE '%tenant_id%'
            `);
            if (uniqueConstraintExists.length === 0) {
                await queryRunner.query(`
                    ALTER TABLE auth_entity 
                    ADD CONSTRAINT auth_entity_tenant_id_unique UNIQUE (tenant_id)
                `);
            }
            // Sonra NOT NULL yap
            await queryRunner.query('ALTER TABLE auth_entity ALTER COLUMN tenant_id SET NOT NULL');
        }

        // 4. Diğer entity'lere tenant_id ekle (eğer yoksa)
        const cardTable = await queryRunner.getTable('card_entity');
        if (!cardTable?.findColumnByName('tenant_id')) {
            await queryRunner.addColumn('card_entity', new TableColumn({
                name: 'tenant_id',
                type: 'bigint',
                isNullable: true,
            }));
        }

        const stokTable = await queryRunner.getTable('stok_entity');
        if (!stokTable?.findColumnByName('tenant_id')) {
            await queryRunner.addColumn('stok_entity', new TableColumn({
                name: 'tenant_id',
                type: 'bigint',
                isNullable: true,
            }));
        }

        const teklifTable = await queryRunner.getTable('teklif_entity');
        if (!teklifTable?.findColumnByName('tenant_id')) {
            await queryRunner.addColumn('teklif_entity', new TableColumn({
                name: 'tenant_id',
                type: 'bigint',
                isNullable: true,
            }));
        }

        const yapilanlarTable = await queryRunner.getTable('yapilanlar');
        if (!yapilanlarTable?.findColumnByName('tenant_id')) {
            await queryRunner.addColumn('yapilanlar', new TableColumn({
                name: 'tenant_id',
                type: 'bigint',
                isNullable: true,
            }));
        }

        // 5. Mevcut verilere default tenant_id ata (ilk auth kaydının tenant_id'si)
        const firstAuth = await queryRunner.query('SELECT tenant_id FROM auth_entity ORDER BY id LIMIT 1');
        if (firstAuth.length > 0) {
            const defaultTenantId = firstAuth[0].tenant_id;
            
            // Card verilerine tenant_id ata
            await queryRunner.query(
                `UPDATE card_entity SET tenant_id = ${defaultTenantId} WHERE tenant_id IS NULL`
            );

            // Stok verilerine tenant_id ata
            await queryRunner.query(
                `UPDATE stok_entity SET tenant_id = ${defaultTenantId} WHERE tenant_id IS NULL`
            );

            // Teklif verilerine tenant_id ata
            await queryRunner.query(
                `UPDATE teklif_entity SET tenant_id = ${defaultTenantId} WHERE tenant_id IS NULL`
            );

            // Yapilanlar verilerine tenant_id ata (card veya teklif üzerinden)
            // Önce card_id ile eşleştir
            await queryRunner.query(`
                UPDATE yapilanlar y
                SET tenant_id = (
                    SELECT c.tenant_id 
                    FROM card_entity c 
                    WHERE c.card_id = y.card_id
                )
                WHERE y.card_id IS NOT NULL AND y.tenant_id IS NULL
            `);
            
            // Sonra teklif_id ile eşleştir
            await queryRunner.query(`
                UPDATE yapilanlar y
                SET tenant_id = (
                    SELECT t.tenant_id 
                    FROM teklif_entity t 
                    WHERE t.teklif_id = y.teklif_id
                )
                WHERE y.teklif_id IS NOT NULL AND y.tenant_id IS NULL
            `);
            
            // Kalanları default tenant_id ile doldur
            await queryRunner.query(`
                UPDATE yapilanlar 
                SET tenant_id = ${defaultTenantId} 
                WHERE tenant_id IS NULL
            `);
        }

        // 6. Tüm kolonları NOT NULL yap (eğer henüz değilse)
        const cardTableFinal = await queryRunner.getTable('card_entity');
        if (cardTableFinal?.findColumnByName('tenant_id')?.isNullable) {
            await queryRunner.query('ALTER TABLE card_entity ALTER COLUMN tenant_id SET NOT NULL');
        }
        
        const stokTableFinal = await queryRunner.getTable('stok_entity');
        if (stokTableFinal?.findColumnByName('tenant_id')?.isNullable) {
            await queryRunner.query('ALTER TABLE stok_entity ALTER COLUMN tenant_id SET NOT NULL');
        }
        
        const teklifTableFinal = await queryRunner.getTable('teklif_entity');
        if (teklifTableFinal?.findColumnByName('tenant_id')?.isNullable) {
            await queryRunner.query('ALTER TABLE teklif_entity ALTER COLUMN tenant_id SET NOT NULL');
        }
        
        const yapilanlarTableFinal = await queryRunner.getTable('yapilanlar');
        if (yapilanlarTableFinal?.findColumnByName('tenant_id')?.isNullable) {
            await queryRunner.query('ALTER TABLE yapilanlar ALTER COLUMN tenant_id SET NOT NULL');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Kolonları geri al
        await queryRunner.dropColumn('yapilanlar', 'tenant_id');
        await queryRunner.dropColumn('teklif_entity', 'tenant_id');
        await queryRunner.dropColumn('stok_entity', 'tenant_id');
        await queryRunner.dropColumn('card_entity', 'tenant_id');
        await queryRunner.dropColumn('auth_entity', 'tenant_id');
    }
}

