import { DailyLogForm } from './DailyLogForm';
import { JournalPainTabs } from '../../../components/JournalPainTabs';
import type { DailyLogView } from '../types';

type Props = {
  date: string;
  log: DailyLogView | null;
  onLogSaved: () => void;
};

export function DashboardDayPanel({ date, log, onLogSaved }: Props) {
  return (
    <JournalPainTabs
      date={date}
      journal={
        <DailyLogForm key={date} date={date} initial={log} onSaved={onLogSaved} />
      }
    />
  );
}
