import { Box, Chip, Stack, Typography } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';

dayjs.locale('fr');

type Props = {
  dates: string[];
  onDateClick?: (date: string) => void;
};

export function PeriodDaysList({ dates, onDateClick }: Props) {
  if (dates.length === 0) return null;

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Jours de règles ({dates.length})
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap">
        {dates.map((d) => (
          <Chip
            key={d}
            label={dayjs(d).format('D MMM')}
            size="small"
            color="error"
            variant="outlined"
            clickable={Boolean(onDateClick)}
            onClick={onDateClick ? () => onDateClick(d) : undefined}
          />
        ))}
      </Stack>
    </Box>
  );
}
