import { useCallback, useEffect, useState } from 'react';
import { fetchEventsRange } from '../../events/api';
import type { UserEventView } from '../../events/types';
import { rangeToDates, type RangeKey } from './useHistoryLogs';

export function useHistoryEvents(range: RangeKey) {
  const [events, setEvents] = useState<UserEventView[]>([]);

  const load = useCallback(async () => {
    try {
      const { from, to } = rangeToDates(range);
      const data = await fetchEventsRange(from, to);
      setEvents(data);
    } catch {
      setEvents([]);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  return { events, reload: load };
}
