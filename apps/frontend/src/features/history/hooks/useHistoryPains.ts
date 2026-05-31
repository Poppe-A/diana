import { useCallback, useEffect, useState } from 'react';
import { fetchBodyZones, fetchPainsRange } from '../../physicalPain/api';
import type { PhysicalPainView } from '../../physicalPain/types';

export function useHistoryPains(
  from: string | undefined,
  to: string | undefined,
  enabled: boolean,
  refreshToken = 0,
) {
  const [painsByDate, setPainsByDate] = useState<Map<string, PhysicalPainView[]>>(new Map());
  const [zoneLabelsByCode, setZoneLabelsByCode] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (!enabled || !from || !to) {
      setPainsByDate(new Map());
      setZoneLabelsByCode(new Map());
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [zones, pains] = await Promise.all([fetchBodyZones(), fetchPainsRange(from, to)]);
        if (cancelled) return;

        const labels = new Map(zones.map((z) => [z.code, z.label]));
        const byDate = new Map<string, PhysicalPainView[]>();
        for (const pain of pains) {
          const list = byDate.get(pain.date) ?? [];
          list.push(pain);
          byDate.set(pain.date, list);
        }

        setZoneLabelsByCode(labels);
        setPainsByDate(byDate);
      } catch {
        if (!cancelled) {
          setPainsByDate(new Map());
          setZoneLabelsByCode(new Map());
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [from, to, enabled, refreshToken]);

  const patchPainsForDay = useCallback((date: string, pains: PhysicalPainView[]) => {
    setPainsByDate((current) => {
      const next = new Map(current);
      if (pains.length === 0) {
        next.delete(date);
      } else {
        next.set(date, pains);
      }
      return next;
    });
  }, []);

  return { painsByDate, zoneLabelsByCode, patchPainsForDay };
}
