import { Slider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { SENSATION_MAX, SENSATION_MIN } from '../types';

const desktopMarks = [0, 2, 5, 8, 10].map((value) => ({ value, label: `${value}` }));
const mobileMarks = [0, 5, 10].map((value) => ({ value, label: `${value}` }));

type Props = {
  value: number;
  onChange: (value: number) => void;
  onChangeCommitted?: (value: number) => void;
};

export function SensationSlider({ value, onChange, onChangeCommitted }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5 }}>
        <Typography variant="caption" color="error.main" sx={{ fontWeight: 600 }}>
          Mal-être
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Neutre (5)
        </Typography>
        <Typography variant="caption" color="success.main" sx={{ fontWeight: 600 }}>
          Bien-être
        </Typography>
      </Stack>
      <Slider
        valueLabelDisplay="on"
        step={1}
        marks={isMobile ? mobileMarks : desktopMarks}
        min={SENSATION_MIN}
        max={SENSATION_MAX}
        value={value}
        size={isMobile ? 'medium' : 'medium'}
        onChange={(_, v) => onChange(v as number)}
        onChangeCommitted={
          onChangeCommitted
            ? (_, v) => onChangeCommitted(v as number)
            : undefined
        }
        sx={{
          mt: 3,
          py: 1,
          height: 12,
          borderRadius: 6,
          '& .MuiSlider-rail': {
            height: 12,
            opacity: 1,
            borderRadius: 6,
            background:
              'linear-gradient(90deg, rgb(211, 47, 47) 0%, rgb(158, 158, 158) 50%, rgb(56, 142, 60) 100%)',
          },
          '& .MuiSlider-track': {
            height: 12,
            border: 'none',
            backgroundColor: 'transparent',
            borderRadius: 6,
          },
          '& .MuiSlider-thumb': {
            width: 24,
            height: 24,
          },
          ...(isMobile
            ? {
                '& .MuiSlider-mark[data-index="0"], & .MuiSlider-mark[data-index="2"]': {
                  display: 'none',
                },
              }
            : {
                '& .MuiSlider-mark[data-index="0"], & .MuiSlider-mark[data-index="4"]': {
                  display: 'none',
                },
              }),
        }}
      />
    </Stack>
  );
}
