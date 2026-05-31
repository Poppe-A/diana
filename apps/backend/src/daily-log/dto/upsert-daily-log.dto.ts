import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PeriodFlowLevel } from '../period-flow-level.enum';

const PERIOD_FLOW_LEVEL_NUMBERS: PeriodFlowLevel[] = [
  PeriodFlowLevel.VeryLight,
  PeriodFlowLevel.Light,
  PeriodFlowLevel.Medium,
  PeriodFlowLevel.Heavy,
  PeriodFlowLevel.VeryHeavy,
];

export class UpsertDailyLogDto {
  /** 0 = très mauvais, 5 = neutre, 10 = excellent */
  @IsInt()
  @Min(0)
  @Max(10)
  sensation!: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsBoolean()
  isPeriodDay!: boolean;

  /** 0 = aucune anxiété … 10 = très forte */
  @IsInt()
  @Min(0)
  @Max(10)
  anxietyLevel!: number;

  /** 0 = très mauvais … 10 = excellent */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  sleepQuality?: number;

  @ValidateIf((o: UpsertDailyLogDto) => o.isPeriodDay === true)
  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @IsInt()
  @IsIn(PERIOD_FLOW_LEVEL_NUMBERS)
  periodFlow?: PeriodFlowLevel;
}
