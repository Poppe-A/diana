import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { PhysicalPainService } from './physical-pain.service';
import { UpsertPainsForDateDto } from './dto/upsert-pains-for-date.dto';
import { ListPhysicalPainsQueryDto } from './dto/list-physical-pains.query.dto';

@Controller('physical-pains')
export class PhysicalPainController {
  constructor(private readonly pains: PhysicalPainService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListPhysicalPainsQueryDto) {
    return this.pains.findRange(user.id, query.from, query.to);
  }

  @Get(':date')
  byDate(@CurrentUser() user: AuthUser, @Param('date') date: string) {
    return this.pains.findByDateValidated(user.id, date);
  }

  @Put(':date')
  replaceForDate(
    @CurrentUser() user: AuthUser,
    @Param('date') date: string,
    @Body() dto: UpsertPainsForDateDto,
  ) {
    return this.pains.replaceForDate(user.id, date, dto);
  }
}

