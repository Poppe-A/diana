import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { BodyZone } from '../body-zone/body-zone.entity';

@Entity('physical_pains')
@Index('UQ_physical_pains_user_date_zone', ['userId', 'date', 'zoneId'], { unique: true })
@Index('IDX_physical_pains_user_date', ['userId', 'date'])
@Index('IDX_physical_pains_zone_date', ['zoneId', 'date'])
export class PhysicalPain {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column()
  zoneId: number;

  @ManyToOne(() => BodyZone, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'zoneId' })
  zone: BodyZone;

  @Column({ type: 'tinyint', unsigned: true })
  intensity: number;

  /** ciphertext AES-256-GCM */
  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}

