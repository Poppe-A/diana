import { useCallback, useEffect, useMemo, useState } from 'react';
import type { HistoryViewportStats } from './utils/historyViewportStats';
import { Alert, Skeleton, Stack } from '@mui/material';
import { AppLayout } from '../../components/layout/AppLayout';
import { RangeSelector } from './components/RangeSelector';
import { HistorySummary } from './components/HistorySummary';
import { HistoryLogEditDialog } from './components/HistoryLogEditDialog';
import { SensationChart } from './components/SensationChart';
import { PeriodDaysList } from './components/PeriodDaysList';
import { useHistoryEvents } from './hooks/useHistoryEvents';
import { rangeToDates, useHistoryLogs, type RangeKey } from './hooks/useHistoryLogs';
import {
  CHART_HELP_ZOOM_MIN_POINTS,
  HistoryChartHelpButton,
} from './components/HistoryChartHelpButton';

export function HistoryPage() {
  const [range, setRange] = useState<RangeKey>('30d');
  const { days, filledCount, initialLoading, error, periodDates, average, reload } =
    useHistoryLogs(range);
  const { events } = useHistoryEvents(range);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [viewportStats, setViewportStats] = useState<HistoryViewportStats | null>(null);

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

  const chartZoomHelpActive = days.length >= CHART_HELP_ZOOM_MIN_POINTS;

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

        {initialLoading ? (
          <Skeleton variant="rounded" height={280} />
        ) : (
          <SensationChart
            days={days}
            range={range}
            events={events}
            onSelectDate={setEditDate}
            onViewportStatsChange={handleViewportStatsChange}
          />
        )}

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
          onSaved={() => void reload()}
        />
      </Stack>
    </AppLayout>
  );
}
