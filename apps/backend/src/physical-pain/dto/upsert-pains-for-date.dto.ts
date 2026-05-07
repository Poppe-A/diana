import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpsertPainEntryDto {
  @IsString()
  zoneCode!: string;

  @IsInt()
  @Min(1)
  @Max(10)
  intensity!: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpsertPainsForDateDto {
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => UpsertPainEntryDto)
  pains!: UpsertPainEntryDto[];
}

