import { DailyLogForm } from './DailyLogForm';
import { JournalPainTabs } from '../../../components/JournalPainTabs';
import type { DailyLogView } from '../types';

type Props = {
  date: string;
  log: DailyLogView | null;
  onLogUpdated: (log: DailyLogView) => void;
};

export function DashboardDayPanel({ date, log, onLogUpdated }: Props) {
  return (
    <JournalPainTabs
      date={date}
      journal={
        <DailyLogForm key={date} date={date} initial={log} onLogUpdated={onLogUpdated} />
      }
    />
  );
}
