import { useCallback, useState } from 'react';
import {
  readHistoryChartDisplayPrefs,
  writeHistoryChartDisplayPrefs,
  type HistoryChartDisplayPrefs,
} from '../utils/historyChartDisplayStorage';

type PrefKey = keyof HistoryChartDisplayPrefs;

export function useHistoryChartDisplay() {
  const [prefs, setPrefs] = useState<HistoryChartDisplayPrefs>(readHistoryChartDisplayPrefs);

  const setPref = useCallback((key: PrefKey, value: boolean) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value };
      writeHistoryChartDisplayPrefs(next);
      return next;
    });
  }, []);

  return {
    showPeriodBands: prefs.showPeriodBands,
    showAnxietySeries: prefs.showAnxietySeries,
    showSleepSeries: prefs.showSleepSeries,
    setShowPeriodBands: (value: boolean) => setPref('showPeriodBands', value),
    setShowAnxietySeries: (value: boolean) => setPref('showAnxietySeries', value),
    setShowSleepSeries: (value: boolean) => setPref('showSleepSeries', value),
  };
}
