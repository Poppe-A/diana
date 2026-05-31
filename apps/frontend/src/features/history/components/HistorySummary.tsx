import { Card, CardContent, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

type Props = {
  count: number;
  average: number | null;
  periodDays: number;
  /** Présent quand les stats reflètent la fenêtre visible du graphe (zoom / défilement). */
  viewportLabel?: { dateFrom: string; dateTo: string };
};

function formatAverage(avg: number | null): string {
  if (avg === null) return '—';
  return avg.toFixed(1);
}

function formatViewportRange(dateFrom: string, dateTo: string): string {
  const from = dayjs(dateFrom);
  const to = dayjs(dateTo);
  if (!from.isValid() || !to.isValid()) return '';
  if (from.isSame(to, 'day')) return from.format('D MMMM');
  if (from.isSame(to, 'year')) return `${from.format('D MMM')} – ${to.format('D MMM')}`;
  return `${from.format('D MMM YYYY')} – ${to.format('D MMM YYYY')}`;
}

function StatBlock({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" noWrap>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ color, fontWeight: 700 }}>
        {value}
      </Typography>
    </Stack>
  );
}

export function HistorySummary({ count, average, periodDays, viewportLabel }: Props) {
  const avgColor =
    average === null
      ? undefined
      : average > 1
        ? 'success.main'
        : average < -1
          ? 'error.main'
          : 'text.primary';

  const viewportRangeText = viewportLabel
    ? formatViewportRange(viewportLabel.dateFrom, viewportLabel.dateTo)
    : '';

  return (
    <Card variant="outlined">
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5 },
          '&:last-child': { pb: { xs: 2, sm: 2.5 } },
        }}
      >
        <Stack spacing={1}>
          {viewportRangeText ? (
            <Typography variant="caption" color="text.secondary" display="block">
              Période visible sur le graphe : {viewportRangeText}
            </Typography>
          ) : null}
          <Stack
            direction={{ xs: 'row', sm: 'row' }}
            spacing={{ xs: 2, sm: 4 }}
            divider={
              <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(0,0,0,0.08)' }} />
            }
          >
            <StatBlock label="Ressenti moyen" value={formatAverage(average)} color={avgColor} />
            <StatBlock label="Jours saisis" value={`${count}`} />
            <StatBlock label="Jours de règles" value={`${periodDays}`} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
