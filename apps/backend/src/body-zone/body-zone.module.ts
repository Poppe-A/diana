import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BodyZone } from './body-zone.entity';
import { BodyZoneService } from './body-zone.service';
import { BodyZoneController } from './body-zone.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BodyZone])],
  providers: [BodyZoneService],
  controllers: [BodyZoneController],
  exports: [BodyZoneService],
})
export class BodyZoneModule {}

