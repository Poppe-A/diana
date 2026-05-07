import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoModule } from '../crypto/crypto.module';
import { BodyZoneModule } from '../body-zone/body-zone.module';
import { PhysicalPain } from './physical-pain.entity';
import { PhysicalPainService } from './physical-pain.service';
import { PhysicalPainController } from './physical-pain.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PhysicalPain]), BodyZoneModule, CryptoModule],
  providers: [PhysicalPainService],
  controllers: [PhysicalPainController],
})
export class PhysicalPainModule {}

