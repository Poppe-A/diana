import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import { IconButton, Stack, TextField, Tooltip } from '@mui/material';

type Props = {
  selectedDate: string;
  today: string;
  isToday: boolean;
  isFuture: boolean;
  onShiftDay: (delta: number) => void;
  onSelectDate: (value: string) => void;
  onGoToToday: () => void;
};

export function DailyLogDatePicker({
  selectedDate,
  today,
  isToday,
  isFuture,
  onShiftDay,
  onSelectDate,
  onGoToToday,
}: Props) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Tooltip title="Jour précédent">
        <IconButton size="small" onClick={() => onShiftDay(-1)} aria-label="Jour précédent">
          <ChevronLeftIcon />
        </IconButton>
      </Tooltip>
      <TextField
        type="date"
        size="small"
        value={selectedDate}
        onChange={(e) => onSelectDate(e.target.value)}
        inputProps={{ max: today, 'aria-label': 'Choisir une date' }}
        sx={{ width: { xs: 150, sm: 170 } }}
      />
      <Tooltip title="Jour suivant">
        <span>
          <IconButton
            size="small"
            onClick={() => onShiftDay(1)}
            disabled={isToday || isFuture}
            aria-label="Jour suivant"
          >
            <ChevronRightIcon />
          </IconButton>
        </span>
      </Tooltip>
      {!isToday && (
        <Tooltip title="Aujourd’hui">
          <span style={{ marginLeft: 'auto' }}>
            <IconButton size="large" onClick={onGoToToday} aria-label="Aujourd’hui">
              <TodayIcon />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
}
