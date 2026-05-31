import dayjs from 'dayjs';
import type { DailyLogHistoryDay, DailyLogView } from '../../dailyLog/types';

export function listDatesInclusive(from: string, to: string): string[] {
  const dates: string[] = [];
  let current = from;
  while (current <= to) {
    dates.push(current);
    current = dayjs(current).add(1, 'day').format('YYYY-MM-DD');
  }
  return dates;
}

function isHistoryDay(entry: DailyLogHistoryDay | DailyLogView): entry is DailyLogHistoryDay {
  return 'filled' in entry && typeof entry.filled === 'boolean';
}

/** Complète la plage calendaire même si l’API renvoie encore l’ancien format sparse. */
export function densifyHistoryDays(
  raw: DailyLogHistoryDay[] | DailyLogView[],
  from: string,
  to: string,
): DailyLogHistoryDay[] {
  const calendar = listDatesInclusive(from, to);
  const byDate = new Map<string, DailyLogHistoryDay>();

  for (const item of raw) {
    if (isHistoryDay(item)) {
      byDate.set(item.date, item);
    } else {
      byDate.set(item.date, { date: item.date, filled: true, log: item });
    }
  }

  return calendar.map((date) => byDate.get(date) ?? { date, filled: false, log: null });
}
