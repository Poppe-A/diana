import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class AddBodyZones1762430000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'body_zones',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'code', type: 'varchar', length: '64', isNullable: false },
          { name: 'label', type: 'varchar', length: '255', isNullable: false },
          { name: 'view', type: 'varchar', length: '10', isNullable: false },
          {
            name: 'isActive',
            type: 'tinyint',
            unsigned: true,
            isNullable: false,
            default: 1,
          },
          {
            name: 'sortOrder',
            type: 'int',
            isNullable: false,
            default: 0,
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

    await queryRunner.createIndex(
      'body_zones',
      new TableIndex({
        name: 'UQ_body_zones_code',
        columnNames: ['code'],
        isUnique: true,
      }),
    );

    // Seed minimal: zones coarse + membres gauche/droite
    await queryRunner.query(`
      INSERT INTO body_zones (code, label, view, isActive, sortOrder)
      VALUES
        ('head_front',  'Tête (avant)',  'front', 1, 10),
        ('head_back',   'Tête (dos)',    'back',  1, 11),
        ('torso_front', 'Torse (avant)', 'front', 1, 30),
        ('torso_back',  'Torse (dos)',   'back',  1, 31),
        ('left_arm_front',  'Bras gauche (avant)',  'front', 1, 18),
        ('right_arm_front', 'Bras droit (avant)',   'front', 1, 19),
        ('left_arm_back',   'Bras gauche (dos)',    'back',  1, 22),
        ('right_arm_back',  'Bras droit (dos)',     'back',  1, 23),
        ('left_leg_front',  'Jambe gauche (avant)', 'front', 1, 38),
        ('right_leg_front', 'Jambe droite (avant)', 'front', 1, 39),
        ('left_leg_back',   'Jambe gauche (dos)',   'back',  1, 42),
        ('right_leg_back',  'Jambe droite (dos)',   'back',  1, 43)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('body_zones', 'UQ_body_zones_code');
    await queryRunner.dropTable('body_zones');
  }
}

