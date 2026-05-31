import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/** Complète la table si la migration initiale a été jouée avant l’ajout de `color`. */
export class AddUserEventsColor1762500001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_events');
    if (!table || table.findColumnByName('color')) return;

    await queryRunner.addColumn(
      'user_events',
      new TableColumn({
        name: 'color',
        type: 'varchar',
        length: '16',
        default: "'blue'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_events');
    if (!table?.findColumnByName('color')) return;
    await queryRunner.dropColumn('user_events', 'color');
  }
}
