import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { CryptoService } from '../crypto/crypto.service';
import { BodyZoneService } from '../body-zone/body-zone.service';
import { PhysicalPain } from './physical-pain.entity';
import { UpsertPainsForDateDto } from './dto/upsert-pains-for-date.dto';

export type PhysicalPainView = {
  id: number;
  date: string;
  zoneCode: string;
  intensity: number;
  comment: string | null;
};

@Injectable()
export class PhysicalPainService {
  constructor(
    @InjectRepository(PhysicalPain)
    private readonly repo: Repository<PhysicalPain>,
    private readonly zones: BodyZoneService,
    private readonly crypto: CryptoService,
  ) {}

  private formatDate(value: string | Date): string {
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
  }

  private encryptComment(value: string | undefined): string | null {
    if (!value?.length) return null;
    return this.crypto.encryptText(value);
  }

  private decryptComment(ciphertext: string | null): string | null {
    if (!ciphertext) return null;
    const plain = this.crypto.decryptText(ciphertext);
    if (plain === null) {
      throw new InternalServerErrorException('Physical pain comment unreadable');
    }
    return plain;
  }

  private toView(row: PhysicalPain): PhysicalPainView {
    const zoneCode =
      (row as any).zone?.code ??
      (row as any).zoneCode ??
      undefined;
    if (!zoneCode) {
      throw new InternalServerErrorException('Physical pain zone missing');
    }
    return {
      id: row.id,
      date: this.formatDate(row.date as unknown as string),
      zoneCode,
      intensity: row.intensity,
      comment: this.decryptComment(row.comment),
    };
  }

  async findByDateValidated(userId: number, date: string): Promise<PhysicalPainView[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date');
    }
    const rows = await this.repo.find({
      where: { userId, date },
      relations: { zone: true },
      order: { id: 'ASC' },
    });
    return rows.map((r) => this.toView(r));
  }

  async findRange(
    userId: number,
    from: string,
    to: string,
  ): Promise<PhysicalPainView[]> {
    if (from > to) throw new BadRequestException('from must be before or equal to to');
    const rows = await this.repo.find({
      where: { userId, date: Between(from, to) },
      relations: { zone: true },
      order: { date: 'ASC', id: 'ASC' },
    });
    return rows.map((r) => this.toView(r));
  }

  async replaceForDate(
    userId: number,
    date: string,
    dto: UpsertPainsForDateDto,
  ): Promise<PhysicalPainView[]> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date');
    }

    // Validate/resolve zone codes
    const uniqueCodes = Array.from(new Set(dto.pains.map((p) => p.zoneCode)));
    const zones = await this.zones.findByCodes(uniqueCodes);
    const byCode = new Map(zones.map((z) => [z.code, z]));
    const unknown = uniqueCodes.filter((c) => !byCode.has(c));
    if (unknown.length) {
      throw new BadRequestException(`Unknown zones: ${unknown.join(', ')}`);
    }

    return this.repo.manager.transaction(async (em) => {
      const existing = await em.find(PhysicalPain, {
        where: { userId, date },
      });
      const keepZoneIds = new Set(dto.pains.map((p) => byCode.get(p.zoneCode)!.id));

      const toDelete = existing
        .filter((row) => !keepZoneIds.has(row.zoneId))
        .map((row) => row.id);
      if (toDelete.length) {
        await em.delete(PhysicalPain, { id: In(toDelete) });
      }

      // Upsert: update existing rows by zoneId, create missing
      const existingByZoneId = new Map(existing.map((r) => [r.zoneId, r]));
      for (const entry of dto.pains) {
        const zone = byCode.get(entry.zoneCode)!;
        const encryptedComment = this.encryptComment(entry.comment);
        const intensity = entry.intensity;

        const row = existingByZoneId.get(zone.id);
        if (row) {
          row.intensity = intensity;
          row.comment = encryptedComment;
          await em.save(PhysicalPain, row);
        } else {
          const created = em.create(PhysicalPain, {
            userId,
            date,
            zoneId: zone.id,
            intensity,
            comment: encryptedComment,
          });
          await em.save(PhysicalPain, created);
        }
      }

      const saved = await em.find(PhysicalPain, {
        where: { userId, date },
        relations: { zone: true },
        order: { id: 'ASC' },
      });
      return saved.map((r) => this.toView(r));
    });
  }
}

