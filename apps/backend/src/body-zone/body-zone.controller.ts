import { Controller, Get } from '@nestjs/common';
import { BodyZoneService } from './body-zone.service';

@Controller('body-zones')
export class BodyZoneController {
  constructor(private readonly bodyZones: BodyZoneService) {}

  @Get()
  list() {
    return this.bodyZones.listActive();
  }
}

