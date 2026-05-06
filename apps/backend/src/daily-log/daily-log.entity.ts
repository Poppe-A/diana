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

@Entity('daily_logs')
@Index('UQ_daily_log_user_date', ['userId', 'date'], { unique: true })
export class DailyLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  /** ciphertext AES-256-GCM (entier −10…+10 en clair côté appli) */
  @Column({ type: 'text' })
  sensation: string;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  /** ciphertext AES-256-GCM (`0` / `1` en clair côté appli) */
  @Column({ type: 'text' })
  isPeriodDay: string;

  /** Intensité du flux 1…5 ; null si pas de règles ou non renseigné */
  @Column({ type: 'tinyint', unsigned: true, nullable: true })
  periodFlow: number | null;

  /** Niveau d'anxiété 0…10 */
  @Column({ type: 'tinyint', unsigned: true, default: 0 })
  anxietyLevel: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
