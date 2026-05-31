import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { UserEvent } from './user-event.entity';
import { CreateUserEventDto } from './dto/create-user-event.dto';
import { UpdateUserEventDto } from './dto/update-user-event.dto';
import { DEFAULT_EVENT_COLOR, EventColor, isEventColor } from './event-color.enum';

export type UserEventView = {
  id: number;
  title: string;
  comment: string | null;
  startDate: string;
  endDate: string;
  color: EventColor;
};

@Injectable()
export class UserEventService {
  constructor(
    @InjectRepository(UserEvent)
    private readonly repo: Repository<UserEvent>,
  ) {}

  private formatDate(value: string | Date): string {
    if (typeof value === 'string') return value.slice(0, 10);
    return value.toISOString().slice(0, 10);
  }

  private assertValidDate(date: string, label: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(`Invalid ${label}`);
    }
  }

  private normalizeComment(value: string | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed?.length ? trimmed : null;
  }

  private resolveEndDate(startDate: string, endDate?: string): string {
    const resolved = endDate?.trim() || startDate;
    this.assertValidDate(resolved, 'endDate');
    if (resolved < startDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }
    return resolved;
  }

  private normalizeColor(value: string | undefined): EventColor {
    if (value && isEventColor(value)) {
      return value;
    }
    return DEFAULT_EVENT_COLOR;
  }

  private toView(row: UserEvent): UserEventView {
    const color = isEventColor(row.color) ? row.color : DEFAULT_EVENT_COLOR;
    return {
      id: row.id,
      title: row.title,
      comment: row.comment,
      startDate: this.formatDate(row.startDate as unknown as string),
      endDate: this.formatDate(row.endDate as unknown as string),
      color,
    };
  }

  async list(
    userId: number,
    from?: string,
    to?: string,
  ): Promise<UserEventView[]> {
    if ((from && !to) || (!from && to)) {
      throw new BadRequestException('from and to must be provided together');
    }

    if (from && to) {
      this.assertValidDate(from, 'from');
      this.assertValidDate(to, 'to');
      if (from > to) {
        throw new BadRequestException('from must be on or before to');
      }
      const rows = await this.repo.find({
        where: {
          userId,
          startDate: LessThanOrEqual(to),
          endDate: MoreThanOrEqual(from),
        },
        order: { startDate: 'ASC', id: 'ASC' },
      });
      return rows.map((r) => this.toView(r));
    }

    const rows = await this.repo.find({
      where: { userId },
      order: { startDate: 'DESC', id: 'DESC' },
    });
    return rows.map((r) => this.toView(r));
  }

  async create(userId: number, dto: CreateUserEventDto): Promise<UserEventView> {
    this.assertValidDate(dto.startDate, 'startDate');
    const endDate = this.resolveEndDate(dto.startDate, dto.endDate);
    const row = this.repo.create({
      userId,
      title: dto.title.trim(),
      comment: this.normalizeComment(dto.comment),
      startDate: dto.startDate,
      endDate,
      color: this.normalizeColor(dto.color),
    });
    const saved = await this.repo.save(row);
    return this.toView(saved);
  }

  async update(userId: number, id: number, dto: UpdateUserEventDto): Promise<UserEventView> {
    const row = await this.repo.findOne({ where: { id, userId } });
    if (!row) {
      throw new BadRequestException('Event not found');
    }

    if (dto.title !== undefined) {
      row.title = dto.title.trim();
    }
    if (dto.comment !== undefined) {
      row.comment = this.normalizeComment(dto.comment);
    }
    if (dto.startDate !== undefined) {
      this.assertValidDate(dto.startDate, 'startDate');
      row.startDate = dto.startDate;
    }
    if (dto.endDate !== undefined) {
      this.assertValidDate(dto.endDate, 'endDate');
      row.endDate = dto.endDate;
    }
    if (dto.color !== undefined) {
      row.color = this.normalizeColor(dto.color);
    }

    row.endDate = this.resolveEndDate(
      this.formatDate(row.startDate as unknown as string),
      row.endDate ? this.formatDate(row.endDate as unknown as string) : undefined,
    );

    const saved = await this.repo.save(row);
    return this.toView(saved);
  }

  async delete(userId: number, id: number): Promise<void> {
    const result = await this.repo.delete({ id, userId });
    if (!result.affected) {
      throw new BadRequestException('Event not found');
    }
  }
}
