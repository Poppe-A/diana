import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HistoryViewportStats } from './utils/historyViewportStats';
import { Alert, Stack } from '@mui/material';
import { AppLayout } from '../../components/layout/AppLayout';
import { RangeSelector } from './components/RangeSelector';
import { HistorySummary } from './components/HistorySummary';
import { HistoryLogEditDialog } from './components/HistoryLogEditDialog';
import { SensationChart } from './components/SensationChart';
import { PeriodDaysList } from './components/PeriodDaysList';
import { useHistoryEvents } from './hooks/useHistoryEvents';
import { rangeToDates, useHistoryLogs, type RangeKey } from './hooks/useHistoryLogs';
import { useHistoryChartDisplay, HistoryChartDisplayProvider } from './hooks/useHistoryChartDisplay';
import { useHistoryPains } from './hooks/useHistoryPains';
import { resolveChartDays } from './utils/chartDaysForRange';
import {
  CHART_HELP_ZOOM_MIN_POINTS,
  HistoryChartHelpButton,
} from './components/HistoryChartHelpButton';
import type { DailyLogView } from '../dailyLog/types';
import type { PhysicalPainView } from '../physicalPain/types';

export function HistoryPage() {
  return (
    <HistoryChartDisplayProvider>
      <HistoryPageContent />
    </HistoryChartDisplayProvider>
  );
}

function HistoryPageContent() {
  const [range, setRange] = useState<RangeKey>('30d');
  const { days, filledCount, initialLoading, isRefreshing, error, periodDates, average, patchDay } =
    useHistoryLogs(range);
  const { events } = useHistoryEvents(range);
  const { showPainDetailsInTooltip } = useHistoryChartDisplay();
  const chartDataLoading = initialLoading || isRefreshing;
  const chartDays = useMemo(
    () => resolveChartDays(range, days, chartDataLoading),
    [range, days, chartDataLoading],
  );
  const painsRangeFrom = chartDays[0]?.date;
  const painsRangeTo = chartDays[chartDays.length - 1]?.date;
  const { painsByDate, zoneLabelsByCode, patchPainsForDay } = useHistoryPains(
    painsRangeFrom,
    painsRangeTo,
    showPainDetailsInTooltip && !chartDataLoading,
  );
  const [editDate, setEditDate] = useState<string | null>(null);
  const [viewportStats, setViewportStats] = useState<HistoryViewportStats | null>(null);

  const handleLogUpdated = useCallback(
    (log: DailyLogView) => {
      patchDay(log);
    },
    [patchDay],
  );

  const handlePainsUpdated = useCallback(
    (pains: PhysicalPainView[]) => {
      const painDate = pains[0]?.date ?? editDate;
      if (painDate) {
        patchPainsForDay(painDate, pains);
      }
    },
    [editDate, patchPainsForDay],
  );

  const handleViewportStatsChange = useCallback((stats: HistoryViewportStats | null) => {
    setViewportStats(stats);
  }, []);

  useEffect(() => {
    setViewportStats(null);
  }, [range]);

  const { from: rangeMinDate, to: rangeMaxDate } = useMemo(() => rangeToDates(range), [range]);

  const selectedDay = useMemo(
    () => (editDate ? days.find((d) => d.date === editDate) : undefined),
    [editDate, days],
  );

  const chartZoomHelpActive = chartDays.length >= CHART_HELP_ZOOM_MIN_POINTS;

  return (
    <AppLayout
      title="Historique"
      subtitle="Visualise l’évolution de ton ressenti dans le temps"
      maxWidth="md"
      action={<HistoryChartHelpButton zoomActive={chartZoomHelpActive} />}
    >
      <Stack spacing={3}>
        <HistorySummary
          count={viewportStats?.count ?? filledCount}
          average={viewportStats?.average ?? average}
          periodDays={viewportStats?.periodDays ?? periodDates.length}
          viewportLabel={
            viewportStats
              ? { dateFrom: viewportStats.dateFrom, dateTo: viewportStats.dateTo }
              : undefined
          }
        />

        <RangeSelector value={range} onChange={setRange} />

        {error && <Alert severity="error">{error}</Alert>}

        <SensationChart
          days={chartDays}
          range={range}
          events={events}
          dataLoading={chartDataLoading}
          painsByDate={painsByDate}
          zoneLabelsByCode={zoneLabelsByCode}
          onSelectDate={chartDataLoading ? undefined : setEditDate}
          onViewportStatsChange={chartDataLoading ? undefined : handleViewportStatsChange}
        />

        <PeriodDaysList dates={periodDates} onDateClick={setEditDate} />

        <HistoryLogEditDialog
          open={editDate !== null}
          date={editDate}
          minDate={rangeMinDate}
          maxDate={rangeMaxDate}
          filled={selectedDay?.filled ?? false}
          initialLog={selectedDay?.log ?? null}
          onDateChange={setEditDate}
          onClose={() => setEditDate(null)}
          onLogUpdated={handleLogUpdated}
          onPainsUpdated={handlePainsUpdated}
        />
      </Stack>
    </AppLayout>
  );
}
