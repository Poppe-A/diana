import { IsDateString, IsOptional } from 'class-validator';

export class ListUserEventsQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
