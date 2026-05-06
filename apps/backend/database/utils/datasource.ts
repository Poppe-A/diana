import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

export const connectionSourceOptions: DataSourceOptions = {
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  username: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  logging: false,
  entities: [join(__dirname, '/../../src/**/*.entity.{ts,js}')],
  synchronize: false,
  migrationsRun: false,
};

export const migrationConnectionSourceOptions: Pick<
  DataSourceOptions,
  'migrations' | 'migrationsTableName' | 'logging'
> = {
  migrations: [join(__dirname, '/../migrations/**/*{.ts,.js}')],
  migrationsTableName: 'typeorm_migrations',
  logging: true,
};

export const connectionSource = new DataSource({
  ...connectionSourceOptions,
  ...migrationConnectionSourceOptions,
});
