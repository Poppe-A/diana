import { useCallback, useEffect, useMemo, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Stack, ToggleButton, ToggleButtonGroup, Typography, Box, Chip } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import { PageLayout } from '../../components/PageLayout';
import { api } from '../../api/client';
import type { DailyLogView } from '../dailyLog/DashboardPage';

dayjs.locale('fr');

type RangeKey = '30d' | '3m' | '1y';

function rangeToDates(key: RangeKey): { from: string; to: string } {
  const to = dayjs();
  const from =
    key === '30d' ? to.subtract(30, 'day') : key === '3m' ? to.subtract(3, 'month') : to.subtract(1, 'year');
  return { from: from.format('YYYY-MM-DD'), to: to.format('YYYY-MM-DD') };
}

export function HistoryPage() {
  const [range, setRange] = useState<RangeKey>('30d');
  const [logs, setLogs] = useState<DailyLogView[]>([]);

  const load = useCallback(async () => {
    const { from, to } = rangeToDates(range);
    const { data } = await api.get<DailyLogView[]>('/daily-logs', { params: { from, to } });
    setLogs(data);
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  const dataset = useMemo(
    () =>
      logs.map((l) => ({
        date: l.date,
        douleur: l.painLevel,
      })),
    [logs],
  );

  const periodDates = useMemo(() => logs.filter((l) => l.isPeriodDay).map((l) => l.date), [logs]);

  const avg =
    logs.length > 0 ? (logs.reduce((s, l) => s + l.painLevel, 0) / logs.length).toFixed(1) : '—';

  return (
    <PageLayout title="Historique">
      <Stack spacing={3}>
        <ToggleButtonGroup
          exclusive
          value={range}
          onChange={(_, v) => v && setRange(v)}
          color="primary"
        >
          <ToggleButton value="30d">30 jours</ToggleButton>
          <ToggleButton value="3m">3 mois</ToggleButton>
          <ToggleButton value="1y">1 an</ToggleButton>
        </ToggleButtonGroup>

        <Typography variant="body2" color="text.secondary">
          Moyenne sur la période : <strong>{avg}</strong> · {logs.length} jour(s) enregistré(s)
        </Typography>

        {dataset.length === 0 ? (
          <Typography>Aucune donnée sur cette période.</Typography>
        ) : (
          <Box sx={{ width: '100%', overflowX: 'auto' }}>
            <LineChart
              dataset={dataset}
              xAxis={[{ scaleType: 'band', dataKey: 'date' }]}
              series={[{ dataKey: 'douleur', label: 'Douleur', showMark: true }]}
              height={320}
              margin={{ left: 48, right: 16, top: 16, bottom: 32 }}
            />
          </Box>
        )}

        {periodDates.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Jours de règles
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              {periodDates.map((d) => (
                <Chip key={d} label={dayjs(d).format('D MMM')} size="small" />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </PageLayout>
  );
}
