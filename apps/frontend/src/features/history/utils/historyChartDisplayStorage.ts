export type HistoryChartDisplayPrefs = {
  showPeriodBands: boolean;
  showAnxietySeries: boolean;
  showSleepSeries: boolean;
};

const STORAGE_KEY = 'diana:historyChart:display';

const DEFAULT_PREFS: HistoryChartDisplayPrefs = {
  showPeriodBands: false,
  showAnxietySeries: false,
  showSleepSeries: false,
};

export function readHistoryChartDisplayPrefs(): HistoryChartDisplayPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<HistoryChartDisplayPrefs>;
    return {
      showPeriodBands: Boolean(parsed.showPeriodBands),
      showAnxietySeries: Boolean(parsed.showAnxietySeries),
      showSleepSeries: Boolean(parsed.showSleepSeries),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writeHistoryChartDisplayPrefs(prefs: HistoryChartDisplayPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
