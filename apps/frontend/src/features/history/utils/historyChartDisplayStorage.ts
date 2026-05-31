export type HistoryChartDisplayPrefs = {
  showSensationSeries: boolean;
  showEventBands: boolean;
  showUnfilledDayBands: boolean;
  showPeriodBands: boolean;
  showAnxietySeries: boolean;
  showSleepSeries: boolean;
  showPainDetailsInTooltip: boolean;
};

const STORAGE_KEY = 'diana:historyChart:display';

const DEFAULT_PREFS: HistoryChartDisplayPrefs = {
  showSensationSeries: true,
  showEventBands: true,
  showUnfilledDayBands: true,
  showPeriodBands: false,
  showAnxietySeries: false,
  showSleepSeries: false,
  showPainDetailsInTooltip: false,
};

export function readHistoryChartDisplayPrefs(): HistoryChartDisplayPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const parsed = JSON.parse(raw) as Partial<HistoryChartDisplayPrefs>;
    return {
      showSensationSeries:
        parsed.showSensationSeries !== undefined
          ? Boolean(parsed.showSensationSeries)
          : DEFAULT_PREFS.showSensationSeries,
      showEventBands:
        parsed.showEventBands !== undefined
          ? Boolean(parsed.showEventBands)
          : DEFAULT_PREFS.showEventBands,
      showUnfilledDayBands:
        parsed.showUnfilledDayBands !== undefined
          ? Boolean(parsed.showUnfilledDayBands)
          : DEFAULT_PREFS.showUnfilledDayBands,
      showPeriodBands: Boolean(parsed.showPeriodBands),
      showAnxietySeries: Boolean(parsed.showAnxietySeries),
      showSleepSeries: Boolean(parsed.showSleepSeries),
      showPainDetailsInTooltip: Boolean(parsed.showPainDetailsInTooltip),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function writeHistoryChartDisplayPrefs(prefs: HistoryChartDisplayPrefs): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}
