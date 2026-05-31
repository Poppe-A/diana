import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { DailyLogDraft } from '../dailyLogPayload';
import { PERIOD_FLOW_LABELS, PERIOD_FLOW_ORDER, PeriodFlowLevel } from '../types';

type Props = {
  draft: DailyLogDraft;
  periodAnswered: boolean;
  onChange: (update: Partial<DailyLogDraft>) => void;
  /** Sera utilisé pour masquer l’étape selon le profil (ex. genre). */
  visible?: boolean;
};

export function WizardPeriodStep({
  draft,
  periodAnswered,
  onChange,
  visible = true,
}: Props) {
  if (!visible) return null;

  return (
    <Stack spacing={4} alignItems="stretch">
      <Typography variant="body1" textAlign="center">
        Règles aujourd’hui&nbsp;?
      </Typography>

      <Stack direction="row" spacing={2}>
        <Button
          variant={draft.isPeriodDay ? 'contained' : 'outlined'}
          size="large"
          fullWidth
          onClick={() => onChange({ isPeriodDay: true })}
        >
          Oui
        </Button>
        <Button
          variant={periodAnswered && !draft.isPeriodDay ? 'contained' : 'outlined'}
          size="large"
          fullWidth
          onClick={() => onChange({ isPeriodDay: false, periodFlow: '' })}
        >
          Non
        </Button>
      </Stack>

      {draft.isPeriodDay && (
        <FormControl fullWidth>
          <InputLabel id="wizard-period-flow-label">Intensité du flux (optionnel)</InputLabel>
          <Select
            labelId="wizard-period-flow-label"
            label="Intensité du flux (optionnel)"
            value={draft.periodFlow}
            onChange={(e) =>
              onChange({ periodFlow: e.target.value as '' | PeriodFlowLevel, isPeriodDay: true })
            }
          >
            <MenuItem value="">
              <em>Non renseigné</em>
            </MenuItem>
            {PERIOD_FLOW_ORDER.map((level) => (
              <MenuItem key={level} value={level}>
                {PERIOD_FLOW_LABELS[level]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Stack>
  );
}
