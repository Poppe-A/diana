import { Paper, Stack, Typography } from '@mui/material';

type Props = {
  count: number;
  average: number | null;
  periodDays: number;
};

function formatAverage(avg: number | null): string {
  if (avg === null) return '—';
  return avg.toFixed(1);
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

export function HistorySummary({ count, average, periodDays }: Props) {
  const avgColor =
    average === null
      ? undefined
      : average > 1
        ? 'success.main'
        : average < -1
          ? 'error.main'
          : 'text.primary';

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3 }}
    >
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
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Échelle de −10 (mal-être) à +10 (bien-être).
      </Typography>
    </Paper>
  );
}
