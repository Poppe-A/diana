import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEvent } from './user-event.entity';
import { UserEventService } from './user-event.service';
import { UserEventController } from './user-event.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEvent])],
  controllers: [UserEventController],
  providers: [UserEventService],
})
export class UserEventModule {}
