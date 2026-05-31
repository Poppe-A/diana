import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { fetchLogsRange } from '../../dailyLog/api';
import type { DailyLogHistoryDay } from '../../dailyLog/types';
import { densifyHistoryDays } from '../utils/densifyHistoryDays';

export type RangeKey = '30d' | '3m' | '1y';

export function rangeToDates(key: RangeKey): { from: string; to: string } {
  const to = dayjs();
  const from =
    key === '30d'
      ? to.subtract(30, 'day')
      : key === '3m'
        ? to.subtract(3, 'month')
        : to.subtract(1, 'year');
  return { from: from.format('YYYY-MM-DD'), to: to.format('YYYY-MM-DD') };
}

export function useHistoryLogs(range: RangeKey) {
  const [days, setDays] = useState<DailyLogHistoryDay[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (background: boolean) => {
    if (!background) {
      setInitialLoading(true);
    }
    setError(null);
    try {
      const { from, to } = rangeToDates(range);
      const data = await fetchLogsRange(from, to);
      setDays(densifyHistoryDays(data, from, to));
    } catch {
      if (!background) {
        setDays([]);
      }
      setError('Impossible de charger l’historique.');
    } finally {
      if (!background) {
        setInitialLoading(false);
      }
    }
  }, [range]);

  useEffect(() => {
    void load(false);
  }, [load]);

  const reload = useCallback(() => load(true), [load]);

  const filledDays = useMemo(() => days.filter((d) => d.filled && d.log), [days]);

  const periodDates = useMemo(
    () =>
      filledDays.filter((d) => d.log!.isPeriodDay).map((d) => d.date),
    [filledDays],
  );

  const average = useMemo(() => {
    const logs = filledDays.map((d) => d.log!);
    if (logs.length === 0) return null;
    return logs.reduce((sum, log) => sum + log.sensation, 0) / logs.length;
  }, [filledDays]);

  return {
    days,
    filledCount: filledDays.length,
    initialLoading,
    error,
    reload,
    periodDates,
    average,
  };
}
