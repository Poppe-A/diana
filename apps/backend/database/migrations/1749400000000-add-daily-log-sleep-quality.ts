import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDailyLogSleepQuality1749400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'daily_logs',
      new TableColumn({
        name: 'sleepQuality',
        type: 'tinyint',
        unsigned: true,
        default: 0,
        isNullable: false,
        comment: 'Qualité du sommeil (0 = très mauvais … 10 = excellent)',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('daily_logs', 'sleepQuality');
  }
}
