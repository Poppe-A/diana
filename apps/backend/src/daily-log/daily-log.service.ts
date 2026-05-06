import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyLog } from './daily-log.entity';
import { UpsertDailyLogDto } from './dto/upsert-daily-log.dto';
import { CryptoService } from '../crypto/crypto.service';

export type DailyLogView = {
  id: number;
  date: string;
  sensation: number;
  comment: string | null;
  isPeriodDay: boolean;
};

@Injectable()
export class DailyLogService {
  constructor(
    @InjectRepository(DailyLog)
    private readonly repo: Repository<DailyLog>,
    private readonly crypto: CryptoService,
  ) {}

  private formatDate(value: string | Date): string {
    if (typeof value === 'string') {
      return value.slice(0, 10);
    }
    return value.toISOString().slice(0, 10);
  }

  private encryptSensation(value: number): string {
    return this.crypto.encryptText(String(value));
  }

  private decryptSensation(ciphertext: string): number {
    const plain = this.crypto.decryptText(ciphertext);
    if (plain === null) {
      throw new InternalServerErrorException('Daily log sensation unreadable');
    }
    const n = Number(plain);
    if (!Number.isFinite(n) || !Number.isInteger(n)) {
      throw new InternalServerErrorException('Daily log sensation unreadable');
    }
    return n;
  }

  private encryptPeriodDay(value: boolean): string {
    return this.crypto.encryptText(value ? '1' : '0');
  }

  private decryptPeriodDay(ciphertext: string): boolean {
    const plain = this.crypto.decryptText(ciphertext);
    if (plain === null) {
      throw new InternalServerErrorException('Daily log period flag unreadable');
    }
    return plain === '1';
  }

  private toView(row: DailyLog): DailyLogView {
    const decryptedComment = row.comment ? this.crypto.decryptText(row.comment) : null;
    return {
      id: row.id,
      date: this.formatDate(row.date as unknown as string),
      sensation: this.decryptSensation(row.sensation),
      comment: decryptedComment,
      isPeriodDay: this.decryptPeriodDay(row.isPeriodDay),
    };
  }

  async findRange(userId: number, from: string, to: string): Promise<DailyLogView[]> {
    if (from > to) {
      throw new BadRequestException('from must be before or equal to to');
    }
    const rows = await this.repo.find({
      where: { userId, date: Between(from, to) },
      order: { date: 'ASC' },
    });
    return rows.map((r) => this.toView(r));
  }

  async findByDate(userId: number, date: string): Promise<DailyLogView | null> {
    const row = await this.repo.findOne({ where: { userId, date } });
    return row ? this.toView(row) : null;
  }

  async upsert(userId: number, date: string, dto: UpsertDailyLogDto): Promise<DailyLogView> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date');
    }
    const encryptedComment = dto.comment?.length ? this.crypto.encryptText(dto.comment) : null;
    const encSensation = this.encryptSensation(dto.sensation);
    const encPeriod = this.encryptPeriodDay(dto.isPeriodDay);
    const existing = await this.repo.findOne({ where: { userId, date } });
    if (existing) {
      existing.sensation = encSensation;
      existing.comment = encryptedComment;
      existing.isPeriodDay = encPeriod;
      const saved = await this.repo.save(existing);
      return this.toView(saved);
    }
    const created = this.repo.create({
      userId,
      date,
      sensation: encSensation,
      comment: encryptedComment,
      isPeriodDay: encPeriod,
    });
    const saved = await this.repo.save(created);
    return this.toView(saved);
  }
}
