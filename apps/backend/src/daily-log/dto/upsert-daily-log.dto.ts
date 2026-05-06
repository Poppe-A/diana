import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertDailyLogDto {
  /** -10 = forte douleur / mal-être, +10 = très bon bien-être */
  @IsInt()
  @Min(-10)
  @Max(10)
  sensation!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsBoolean()
  isPeriodDay!: boolean;
}
