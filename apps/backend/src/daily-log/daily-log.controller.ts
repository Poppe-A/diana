import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { DailyLogService } from './daily-log.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ListDailyLogsQueryDto } from './dto/list-daily-logs.query.dto';
import { UpsertDailyLogDto } from './dto/upsert-daily-log.dto';

@Controller('daily-logs')
export class DailyLogController {
  constructor(private readonly dailyLogService: DailyLogService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListDailyLogsQueryDto) {
    return this.dailyLogService.findRange(user.id, query.from, query.to);
  }

  @Get('today')
  today(@CurrentUser() user: AuthUser) {
    const today = new Date().toISOString().slice(0, 10);
    return this.dailyLogService.findByDate(user.id, today);
  }

  @Put(':date')
  upsert(
    @CurrentUser() user: AuthUser,
    @Param('date') date: string,
    @Body() dto: UpsertDailyLogDto,
  ) {
    return this.dailyLogService.upsert(user.id, date, dto);
  }
}
