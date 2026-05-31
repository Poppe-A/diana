import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { IconButton, Stack, TextField, Tooltip } from '@mui/material';
import dayjs from 'dayjs';

type Props = {
  date: string;
  minDate: string;
  maxDate: string;
  onDateChange: (date: string) => void;
};

export function HistoryDialogDatePicker({ date, minDate, maxDate, onDateChange }: Props) {
  const atMin = date <= minDate;
  const atMax = date >= maxDate;

  const shiftDay = (delta: number) => {
    const next = dayjs(date).add(delta, 'day').format('YYYY-MM-DD');
    if (next < minDate || next > maxDate) return;
    onDateChange(next);
  };

  const handleChange = (value: string) => {
    if (!value) return;
    if (value < minDate || value > maxDate) return;
    onDateChange(value);
  };

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Tooltip title="Jour précédent">
        <span>
          <IconButton
            size="small"
            onClick={() => shiftDay(-1)}
            disabled={atMin}
            aria-label="Jour précédent"
          >
            <ChevronLeftIcon />
          </IconButton>
        </span>
      </Tooltip>
      <TextField
        type="date"
        size="small"
        label="Date"
        value={date}
        onChange={(e) => handleChange(e.target.value)}
        inputProps={{ min: minDate, max: maxDate, 'aria-label': 'Choisir une date' }}
        sx={{ flex: 1 }}
      />
      <Tooltip title="Jour suivant">
        <span>
          <IconButton
            size="small"
            onClick={() => shiftDay(1)}
            disabled={atMax}
            aria-label="Jour suivant"
          >
            <ChevronRightIcon />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
