import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import {
  readHistoryChartDisplayPrefs,
  writeHistoryChartDisplayPrefs,
  type HistoryChartDisplayPrefs,
} from '../utils/historyChartDisplayStorage';

type PrefKey = keyof HistoryChartDisplayPrefs;

export type HistoryChartDisplayValue = {
  showSensationSeries: boolean;
  showEventBands: boolean;
  showUnfilledDayBands: boolean;
  showPeriodBands: boolean;
  showAnxietySeries: boolean;
  showSleepSeries: boolean;
  showPainDetailsInTooltip: boolean;
  setShowSensationSeries: (value: boolean) => void;
  setShowEventBands: (value: boolean) => void;
  setShowUnfilledDayBands: (value: boolean) => void;
  setShowPeriodBands: (value: boolean) => void;
  setShowAnxietySeries: (value: boolean) => void;
  setShowSleepSeries: (value: boolean) => void;
  setShowPainDetailsInTooltip: (value: boolean) => void;
};

const HistoryChartDisplayContext = createContext<HistoryChartDisplayValue | null>(null);

function useHistoryChartDisplayState(): HistoryChartDisplayValue {
  const [prefs, setPrefs] = useState<HistoryChartDisplayPrefs>(readHistoryChartDisplayPrefs);

  const setPref = useCallback((key: PrefKey, value: boolean) => {
    setPrefs((current) => {
      const next = { ...current, [key]: value };
      writeHistoryChartDisplayPrefs(next);
      return next;
    });
  }, []);

  return {
    showSensationSeries: prefs.showSensationSeries,
    showEventBands: prefs.showEventBands,
    showUnfilledDayBands: prefs.showUnfilledDayBands,
    showPeriodBands: prefs.showPeriodBands,
    showAnxietySeries: prefs.showAnxietySeries,
    showSleepSeries: prefs.showSleepSeries,
    showPainDetailsInTooltip: prefs.showPainDetailsInTooltip,
    setShowSensationSeries: (value: boolean) => setPref('showSensationSeries', value),
    setShowEventBands: (value: boolean) => setPref('showEventBands', value),
    setShowUnfilledDayBands: (value: boolean) => setPref('showUnfilledDayBands', value),
    setShowPeriodBands: (value: boolean) => setPref('showPeriodBands', value),
    setShowAnxietySeries: (value: boolean) => setPref('showAnxietySeries', value),
    setShowSleepSeries: (value: boolean) => setPref('showSleepSeries', value),
    setShowPainDetailsInTooltip: (value: boolean) => setPref('showPainDetailsInTooltip', value),
  };
}

export function HistoryChartDisplayProvider({ children }: { children: ReactNode }) {
  const value = useHistoryChartDisplayState();
  return (
    <HistoryChartDisplayContext.Provider value={value}>
      {children}
    </HistoryChartDisplayContext.Provider>
  );
}

export function useHistoryChartDisplay() {
  const context = useContext(HistoryChartDisplayContext);
  if (context === null) {
    throw new Error('useHistoryChartDisplay must be used within HistoryChartDisplayProvider');
  }
  return context;
}
