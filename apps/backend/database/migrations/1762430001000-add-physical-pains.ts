import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class AddPhysicalPains1762430001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'physical_pains',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'userId', type: 'int' },
          { name: 'date', type: 'date' },
          { name: 'zoneId', type: 'int' },
          {
            name: 'intensity',
            type: 'tinyint',
            unsigned: true,
            isNullable: false,
            comment: 'Intensité 1..10 (en clair, utilisé pour analytics)',
          },
          {
            name: 'comment',
            type: 'text',
            isNullable: true,
            comment: 'ciphertext AES-256-GCM (commentaire optionnel)',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    await queryRunner.createForeignKeys('physical_pains', [
      new TableForeignKey({
        columnNames: ['userId'],
        referencedTableName: 'user',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['zoneId'],
        referencedTableName: 'body_zones',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    await queryRunner.createIndex(
      'physical_pains',
      new TableIndex({
        name: 'UQ_physical_pains_user_date_zone',
        columnNames: ['userId', 'date', 'zoneId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'physical_pains',
      new TableIndex({
        name: 'IDX_physical_pains_user_date',
        columnNames: ['userId', 'date'],
      }),
    );

    await queryRunner.createIndex(
      'physical_pains',
      new TableIndex({
        name: 'IDX_physical_pains_zone_date',
        columnNames: ['zoneId', 'date'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('physical_pains', 'IDX_physical_pains_zone_date');
    await queryRunner.dropIndex('physical_pains', 'IDX_physical_pains_user_date');
    await queryRunner.dropIndex('physical_pains', 'UQ_physical_pains_user_date_zone');
    await queryRunner.dropTable('physical_pains');
  }
}

