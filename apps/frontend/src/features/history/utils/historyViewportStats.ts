import type { DailyLogHistoryDay } from '../../dailyLog/types';

export type HistoryViewportStats = {
  count: number;
  average: number | null;
  periodDays: number;
  isViewportScoped: true;
  dateFrom: string;
  dateTo: string;
};

export function computeVisibleDayIndices(
  daysLength: number,
  scrollLeft: number,
  viewportWidth: number,
  pxPerDay: number,
): { startIndex: number; endIndex: number } {
  if (daysLength === 0) return { startIndex: 0, endIndex: -1 };
  const dayWidth = Math.max(pxPerDay, 0.01);
  const startIndex = Math.max(0, Math.floor(scrollLeft / dayWidth));
  const endIndex = Math.min(
    daysLength - 1,
    Math.max(startIndex, Math.ceil((scrollLeft + viewportWidth) / dayWidth) - 1),
  );
  return { startIndex, endIndex };
}

export function isFullTimelineVisible(
  scrollLeft: number,
  viewportWidth: number,
  plotWidth: number,
  isHorizontallyScrollable: boolean,
): boolean {
  if (!isHorizontallyScrollable) return true;
  return scrollLeft <= 1 && scrollLeft + viewportWidth >= plotWidth - 2;
}

export function computeHistoryViewportStats(
  days: DailyLogHistoryDay[],
  startIndex: number,
  endIndex: number,
): HistoryViewportStats {
  const visibleDays = days.slice(startIndex, endIndex + 1);
  const filled = visibleDays.filter((d) => d.filled && d.log);
  const average =
    filled.length === 0
      ? null
      : filled.reduce((sum, d) => sum + d.log!.sensation, 0) / filled.length;
  const periodDays = filled.filter((d) => d.log!.isPeriodDay).length;

  return {
    count: filled.length,
    average,
    periodDays,
    isViewportScoped: true,
    dateFrom: visibleDays[0]?.date ?? days[startIndex]?.date ?? '',
    dateTo: visibleDays[visibleDays.length - 1]?.date ?? days[endIndex]?.date ?? '',
  };
}
