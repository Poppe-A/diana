import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { UserEventService } from './user-event.service';
import { ListUserEventsQueryDto } from './dto/list-user-events.query.dto';
import { CreateUserEventDto } from './dto/create-user-event.dto';
import { UpdateUserEventDto } from './dto/update-user-event.dto';

@Controller('events')
export class UserEventController {
  constructor(private readonly events: UserEventService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListUserEventsQueryDto) {
    return this.events.list(user.id, query.from, query.to);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserEventDto) {
    return this.events.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserEventDto,
  ) {
    return this.events.update(user.id, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    await this.events.delete(user.id, id);
  }
}
