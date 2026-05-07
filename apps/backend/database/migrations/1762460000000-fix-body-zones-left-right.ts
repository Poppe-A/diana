import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixBodyZonesLeftRight1762460000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert new zones (idempotent-ish in dev)
    await queryRunner.query(`
      INSERT IGNORE INTO body_zones (code, label, view, isActive, sortOrder)
      VALUES
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

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
