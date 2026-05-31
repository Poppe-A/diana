import { Slider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { SLEEP_QUALITY_MAX, SLEEP_QUALITY_MIN } from '../types';

const step = 1;
const desktopMarks = [0, 5, 10].map((value) => ({ value, label: `${value}` }));
const mobileMarks = [0, 10].map((value) => ({ value, label: `${value}` }));

type Props = {
  value: number;
  onChange: (value: number) => void;
};

export function SleepSlider({ value, onChange }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Très mauvais ({SLEEP_QUALITY_MIN})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Excellent ({SLEEP_QUALITY_MAX})
        </Typography>
      </Stack>
      <Slider
        valueLabelDisplay="on"
        step={step}
        marks={isMobile ? mobileMarks : desktopMarks}
        min={SLEEP_QUALITY_MIN}
        max={SLEEP_QUALITY_MAX}
        value={value}
        onChange={(_, v) => onChange(v as number)}
        sx={{
          mt: 2,
          py: 1,
          height: 10,
          borderRadius: 5,
          '& .MuiSlider-rail': {
            height: 10,
            opacity: 1,
            borderRadius: 5,
            background:
              'linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(221, 214, 254) 45%, rgb(49, 16, 117) 100%)',
          },
          '& .MuiSlider-track': {
            height: 10,
            border: 'none',
            backgroundColor: 'transparent',
            borderRadius: 5,
          },
          '& .MuiSlider-thumb': {
            width: 22,
            height: 22,
          },
          ...(isMobile
            ? {
                '& .MuiSlider-mark[data-index="0"], & .MuiSlider-mark[data-index="1"]': {
                  display: 'none',
                },
              }
            : {
                '& .MuiSlider-mark[data-index="0"], & .MuiSlider-mark[data-index="2"]': {
                  display: 'none',
                },
              }),
        }}
      />
    </Stack>
  );
}
