import { useMemo, useState } from 'react';
import { Alert, Skeleton, Stack, Typography } from '@mui/material';
import { AppLayout } from '../../components/layout/AppLayout';
import { RangeSelector } from './components/RangeSelector';
import { HistorySummary } from './components/HistorySummary';
import { HistoryLogEditDialog } from './components/HistoryLogEditDialog';
import { SensationChart } from './components/SensationChart';
import { PeriodDaysList } from './components/PeriodDaysList';
import { useHistoryLogs, type RangeKey } from './hooks/useHistoryLogs';

export function HistoryPage() {
  const [range, setRange] = useState<RangeKey>('30d');
  const { logs, loading, error, periodDates, average, reload } = useHistoryLogs(range);
  const [editDate, setEditDate] = useState<string | null>(null);

  const initialForEdit = useMemo(
    () => (editDate ? logs.find((l) => l.date === editDate) : undefined),
    [editDate, logs],
  );

  return (
    <AppLayout
      title="Historique"
      subtitle="Visualise l’évolution de ton ressenti dans le temps"
      maxWidth="md"
    >
      <Stack spacing={3}>
        <RangeSelector value={range} onChange={setRange} />

        <HistorySummary count={logs.length} average={average} periodDays={periodDates.length} />

        {error && <Alert severity="error">{error}</Alert>}

        {loading ? (
          <Skeleton variant="rounded" height={280} />
        ) : (
          <>
            {logs.length > 0 ? (
              <Typography variant="caption" color="text.secondary">
                Touche un point ou la courbe pour modifier ce jour.
              </Typography>
            ) : null}
            <SensationChart logs={logs} onSelectDate={setEditDate} />
          </>
        )}

        <PeriodDaysList dates={periodDates} onDateClick={setEditDate} />

        <HistoryLogEditDialog
          open={editDate !== null}
          date={editDate}
          initialLog={initialForEdit}
          onClose={() => setEditDate(null)}
          onSaved={() => void reload()}
        />
      </Stack>
    </AppLayout>
  );
}
