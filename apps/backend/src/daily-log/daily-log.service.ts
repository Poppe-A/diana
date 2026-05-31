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
import { isPeriodFlowLevel, PeriodFlowLevel } from './period-flow-level.enum';

export type DailyLogView = {
  id: number;
  date: string;
  sensation: number;
  comment: string | null;
  isPeriodDay: boolean;
  periodFlow: PeriodFlowLevel | null;
  anxietyLevel: number;
  sleepQuality: number;
};

/** Une entrée par jour calendaire ; `log` est null si non renseigné. */
export type DailyLogHistoryDay = {
  date: string;
  filled: boolean;
  log: DailyLogView | null;
};

function listDatesInclusive(from: string, to: string): string[] {
  const dates: string[] = [];
  let current = from;
  while (current <= to) {
    dates.push(current);
    const next = new Date(`${current}T12:00:00.000Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    current = next.toISOString().slice(0, 10);
  }
  return dates;
}

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

  private normalizePeriodFlow(value: number | null): PeriodFlowLevel | null {
    if (value === null || value === undefined) {
      return null;
    }
    if (!isPeriodFlowLevel(value)) {
      throw new InternalServerErrorException('Daily log period flow invalid');
    }
    return value;
  }

  private toView(row: DailyLog): DailyLogView {
    const decryptedComment = row.comment ? this.crypto.decryptText(row.comment) : null;
    return {
      id: row.id,
      date: this.formatDate(row.date as unknown as string),
      sensation: this.decryptSensation(row.sensation),
      comment: decryptedComment,
      isPeriodDay: this.decryptPeriodDay(row.isPeriodDay),
      periodFlow: this.normalizePeriodFlow(row.periodFlow),
      anxietyLevel: row.anxietyLevel ?? 0,
      sleepQuality: row.sleepQuality ?? 0,
    };
  }

  async findRange(userId: number, from: string, to: string): Promise<DailyLogHistoryDay[]> {
    if (from > to) {
      throw new BadRequestException('from must be before or equal to to');
    }
    const rows = await this.repo.find({
      where: { userId, date: Between(from, to) },
      order: { date: 'ASC' },
    });
    const logByDate = new Map(rows.map((row) => [this.formatDate(row.date as unknown as string), row]));

    return listDatesInclusive(from, to).map((date) => {
      const row = logByDate.get(date);
      if (!row) {
        return { date, filled: false, log: null };
      }
      return { date, filled: true, log: this.toView(row) };
    });
  }

  async findByDate(userId: number, date: string): Promise<DailyLogView | null> {
    const row = await this.repo.findOne({ where: { userId, date } });
    return row ? this.toView(row) : null;
  }

  async findByDateValidated(userId: number, date: string): Promise<DailyLogView | null> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date');
    }
    return this.findByDate(userId, date);
  }

  async upsert(userId: number, date: string, dto: UpsertDailyLogDto): Promise<DailyLogView> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date');
    }
    const encryptedComment = dto.comment?.length ? this.crypto.encryptText(dto.comment) : null;
    const encSensation = this.encryptSensation(dto.sensation);
    const encPeriod = this.encryptPeriodDay(dto.isPeriodDay);
    const periodFlowValue =
      dto.isPeriodDay && dto.periodFlow !== undefined ? dto.periodFlow : null;
    const sleepQuality = dto.sleepQuality ?? 0;
    const existing = await this.repo.findOne({ where: { userId, date } });
    if (existing) {
      existing.sensation = encSensation;
      existing.comment = encryptedComment;
      existing.isPeriodDay = encPeriod;
      existing.periodFlow = periodFlowValue;
      existing.anxietyLevel = dto.anxietyLevel;
      existing.sleepQuality =
        dto.sleepQuality !== undefined ? dto.sleepQuality : (existing.sleepQuality ?? 0);
      const saved = await this.repo.save(existing);
      return this.toView(saved);
    }
    const created = this.repo.create({
      userId,
      date,
      sensation: encSensation,
      comment: encryptedComment,
      isPeriodDay: encPeriod,
      periodFlow: periodFlowValue,
      anxietyLevel: dto.anxietyLevel,
      sleepQuality,
    });
    const saved = await this.repo.save(created);
    return this.toView(saved);
  }
}
