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
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ width: '100%' }}>
      <Tooltip title="Jour précédent">
        <IconButton onClick={() => onShiftDay(-1)} aria-label="Jour précédent">
          <ChevronLeftIcon />
        </IconButton>
      </Tooltip>
      <TextField
        type="date"
        size="medium"
        value={selectedDate}
        onChange={(e) => onSelectDate(e.target.value)}
        inputProps={{ max: today, 'aria-label': 'Choisir une date' }}
        sx={{
          flex: 1,
          minWidth: 0,
          '& input': {
            fontSize: { xs: '1rem', sm: '1.05rem' },
            py: { xs: 1.35, sm: 1.5 },
          },
        }}
      />
      <Tooltip title="Jour suivant">
        <span>
          <IconButton
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
          <IconButton onClick={onGoToToday} aria-label="Aujourd’hui">
            <TodayIcon />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
