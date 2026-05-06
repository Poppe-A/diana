import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import type { RangeKey } from '../hooks/useHistoryLogs';

type Props = {
  value: RangeKey;
  onChange: (value: RangeKey) => void;
};

const OPTIONS: { value: RangeKey; label: string; shortLabel: string }[] = [
  { value: '30d', label: '30 jours', shortLabel: '30 j' },
  { value: '3m', label: '3 mois', shortLabel: '3 m' },
  { value: '1y', label: '1 an', shortLabel: '1 an' },
];

export function RangeSelector({ value, onChange }: Props) {
  return (
    <ToggleButtonGroup
      exclusive
      fullWidth
      size="small"
      value={value}
      onChange={(_, v: RangeKey | null) => v && onChange(v)}
      color="primary"
      sx={{
        '& .MuiToggleButton-root': {
          py: { xs: 1, sm: 0.75 },
        },
      }}
    >
      {OPTIONS.map((opt) => (
        <ToggleButton key={opt.value} value={opt.value}>
          <span style={{ display: 'inline' }}>{opt.label}</span>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
