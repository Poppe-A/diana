import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { fetchLogsRange } from '../../dailyLog/api';
import type { DailyLogView } from '../../dailyLog/types';

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
  const [logs, setLogs] = useState<DailyLogView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { from, to } = rangeToDates(range);
      const data = await fetchLogsRange(from, to);
      setLogs(data);
    } catch {
      setError('Impossible de charger l’historique.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const periodDates = useMemo(
    () => logs.filter((l) => l.isPeriodDay).map((l) => l.date),
    [logs],
  );

  const average = useMemo(
    () => (logs.length > 0 ? logs.reduce((s, l) => s + l.sensation, 0) / logs.length : null),
    [logs],
  );

  return { logs, loading, error, reload: load, periodDates, average };
}
