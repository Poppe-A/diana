import { useCallback, useEffect, useState } from 'react';
import { fetchLogByDate } from '../api';
import type { DailyLogView } from '../types';

export function useDailyLog(date: string) {
  const [log, setLog] = useState<DailyLogView | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLogByDate(date);
      setLog(data);
      return data;
    } catch {
      setLog(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLog(null);
    void (async () => {
      try {
        const data = await fetchLogByDate(date);
        if (!cancelled) setLog(data);
      } catch {
        if (!cancelled) setLog(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  return { log, loading, reload };
}
