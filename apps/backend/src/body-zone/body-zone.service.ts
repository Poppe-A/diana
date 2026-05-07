import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { BodyZone } from './body-zone.entity';

export type BodyZoneView = {
  code: string;
  label: string;
  view: 'front' | 'back';
  sortOrder: number;
};

@Injectable()
export class BodyZoneService {
  constructor(
    @InjectRepository(BodyZone)
    private readonly repo: Repository<BodyZone>,
  ) {}

  async listActive(): Promise<BodyZoneView[]> {
    const rows = await this.repo.find({
      where: { isActive: 1 },
      order: { sortOrder: 'ASC', code: 'ASC' },
    });
    return rows.map((z) => ({
      code: z.code,
      label: z.label,
      view: z.view,
      sortOrder: z.sortOrder,
    }));
  }

  async findByCodes(codes: string[]): Promise<BodyZone[]> {
    if (codes.length === 0) return [];
    return this.repo.findBy({ code: In(codes) });
  }

  async findByCode(code: string): Promise<BodyZone | null> {
    return this.repo.findOne({ where: { code } });
  }
}

