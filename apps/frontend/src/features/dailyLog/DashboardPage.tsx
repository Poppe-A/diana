import { useEffect, useMemo, useState } from 'react';
import { Alert, IconButton, Skeleton, Stack, TextField, Tooltip, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { AppLayout } from '../../components/layout/AppLayout';
import { DailyLogForm } from './components/DailyLogForm';
import { fetchLogByDate } from './api';
import { SENSATION_MAX, SENSATION_MIN, type DailyLogView } from './types';

dayjs.extend(localizedFormat);
dayjs.locale('fr');

const DATE_FORMAT = 'YYYY-MM-DD';

export function DashboardPage() {
  const today = dayjs().format(DATE_FORMAT);
  const [selectedDate, setSelectedDate] = useState<string>(today);

  const [log, setLog] = useState<DailyLogView | null>(null);
  const [loading, setLoading] = useState(true);

  const isToday = selectedDate === today;
  const isFuture = dayjs(selectedDate).isAfter(today, 'day');

  const title = useMemo(() => {
    const d = dayjs(selectedDate);
    if (isToday) return d.format('dddd D MMMM');
    if (selectedDate === dayjs().subtract(1, 'day').format(DATE_FORMAT)) {
      return `Hier — ${d.format('dddd D MMMM')}`;
    }
    return d.format('dddd D MMMM YYYY');
  }, [selectedDate, isToday]);

  const subtitle = isToday
    ? 'Comment tu te sens aujourd’hui ?'
    : 'Mets à jour les données de ce jour';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const data = await fetchLogByDate(selectedDate);
        if (!cancelled) setLog(data);
      } catch {
        if (!cancelled) setLog(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const shiftDay = (delta: number) => {
    setSelectedDate((current) => dayjs(current).add(delta, 'day').format(DATE_FORMAT));
  };

  const handleDateChange = (value: string) => {
    if (!value) return;
    if (dayjs(value).isAfter(today, 'day')) return;
    setSelectedDate(value);
  };

  const datePicker = (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Tooltip title="Jour précédent">
        <IconButton size="small" onClick={() => shiftDay(-1)} aria-label="Jour précédent">
          <ChevronLeftIcon />
        </IconButton>
      </Tooltip>
      <TextField
        type="date"
        size="small"
        value={selectedDate}
        onChange={(e) => handleDateChange(e.target.value)}
        inputProps={{ max: today, 'aria-label': 'Choisir une date' }}
        sx={{ width: { xs: 150, sm: 170 } }}
      />
      <Tooltip title="Jour suivant">
        <span>
          <IconButton
            size="small"
            onClick={() => shiftDay(1)}
            disabled={isToday || isFuture}
            aria-label="Jour suivant"
          >
            <ChevronRightIcon />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title="Aujourd’hui">
        <span>
          <IconButton
            size="small"
            onClick={() => setSelectedDate(today)}
            disabled={isToday}
            aria-label="Aujourd’hui"
          >
            <TodayIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );

  return (
    <AppLayout title={title} subtitle={subtitle} action={datePicker}>
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          Échelle de {SENSATION_MIN} (douleur / mal-être) à {SENSATION_MAX} (bien-être). 0 = neutre.
        </Typography>

        {loading ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={120} />
            <Skeleton variant="rounded" height={56} />
          </Stack>
        ) : (
          <DailyLogForm key={selectedDate} date={selectedDate} initial={log} />
        )}

        <Alert severity="info" variant="outlined">
          {isToday
            ? 'Une seule entrée par jour : si tu enregistres à nouveau, la journée est mise à jour.'
            : 'Tu modifies une journée passée. Enregistrer mettra à jour les données de ce jour.'}
        </Alert>
      </Stack>
    </AppLayout>
  );
}
