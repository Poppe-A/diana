import type { DailyLogHistoryDay } from '../../dailyLog/types';
import { densifyHistoryDays } from './densifyHistoryDays';
import { rangeToDates, type RangeKey } from '../hooks/useHistoryLogs';

/** Calendrier vide pour la période : axes du graphe stables pendant le chargement. */
export function placeholderHistoryDays(range: RangeKey): DailyLogHistoryDay[] {
  const { from, to } = rangeToDates(range);
  return densifyHistoryDays([], from, to);
}

export function resolveChartDays(
  range: RangeKey,
  days: DailyLogHistoryDay[],
  loading: boolean,
): DailyLogHistoryDay[] {
  if (!loading) return days;
  return placeholderHistoryDays(range);
}
