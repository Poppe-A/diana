import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDailyLogAnxietyLevel1749300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'daily_logs',
      new TableColumn({
        name: 'anxietyLevel',
        type: 'tinyint',
        unsigned: true,
        default: 0,
        isNullable: false,
        comment: 'Niveau d’anxiété (0 = aucune … 10 = très forte)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('daily_logs', 'anxietyLevel');
  }
}
