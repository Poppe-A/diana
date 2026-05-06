import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDailyLogPeriodFlow1749200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'daily_logs',
      new TableColumn({
        name: 'periodFlow',
        type: 'tinyint',
        unsigned: true,
        isNullable: true,
        comment: 'Intensité du flux (1 = très faible … 5 = très important), null si hors règles ou non renseigné',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('daily_logs', 'periodFlow');
  }
}
