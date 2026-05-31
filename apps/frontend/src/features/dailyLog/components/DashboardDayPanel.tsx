import { DailyLogForm } from './DailyLogForm';
import { PhysicalPainCard } from '../../physicalPain/components/PhysicalPainCard';
import type { DailyLogView } from '../types';

type Props = {
  date: string;
  log: DailyLogView | null;
  onLogSaved: () => void;
};

export function DashboardDayPanel({ date, log, onLogSaved }: Props) {
  return (
    <>
      <DailyLogForm key={date} date={date} initial={log} onSaved={onLogSaved} />
      <PhysicalPainCard date={date} />
    </>
  );
}
