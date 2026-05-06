import { IsDateString } from 'class-validator';

export class ListDailyLogsQueryDto {
  @IsDateString()
  from!: string;

  @IsDateString()
  to!: string;
}
