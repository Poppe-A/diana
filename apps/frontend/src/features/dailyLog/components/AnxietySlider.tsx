import { Slider, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ANXIETY_MAX, ANXIETY_MIN } from '../types';

const step = 1;
const desktopMarks = [0, 5, 10].map((value) => ({ value, label: `${value}` }));
const mobileMarks = [0, 10].map((value) => ({ value, label: `${value}` }));

type Props = {
  value: number;
  onChange: (value: number) => void;
  onChangeCommitted?: (value: number) => void;
};

export function AnxietySlider({ value, onChange, onChangeCommitted }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Aucune ({ANXIETY_MIN})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Très forte ({ANXIETY_MAX})
        </Typography>
      </Stack>
      <Slider
        valueLabelDisplay="on"
        step={step}
        marks={isMobile ? mobileMarks : desktopMarks}
        min={ANXIETY_MIN}
        max={ANXIETY_MAX}
        value={value}
        onChange={(_, v) => onChange(v as number)}
        onChangeCommitted={
          onChangeCommitted
            ? (_, v) => onChangeCommitted(v as number)
            : undefined
        }
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
              'linear-gradient(90deg, rgb(224, 224, 224) 0%, rgb(255, 183, 77) 50%, rgb(230, 81, 0) 100%)',
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
