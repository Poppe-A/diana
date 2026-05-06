import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertDailyLogDto {
  @IsInt()
  @Min(0)
  @Max(10)
  painLevel!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsBoolean()
  isPeriodDay!: boolean;
}
