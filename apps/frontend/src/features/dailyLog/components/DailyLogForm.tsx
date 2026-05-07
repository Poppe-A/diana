import { Controller, useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { AutoDismissSnackbar } from '../../../components/AutoDismissSnackbar';
import { AnxietySlider } from './AnxietySlider';
import { SensationSlider } from './SensationSlider';
import {
  ANXIETY_MAX,
  ANXIETY_MIN,
  PERIOD_FLOW_LABELS,
  PERIOD_FLOW_ORDER,
  PeriodFlowLevel,
  SENSATION_MAX,
  SENSATION_MIN,
  type DailyLogView,
} from '../types';
import { saveDailyLog } from '../api';

type Form = {
  sensation: number;
  anxietyLevel: number;
  comment: string;
  isPeriodDay: boolean;
  periodFlow: '' | PeriodFlowLevel;
};

const PERIOD_FLOW_FORM_VALUES: Array<'' | PeriodFlowLevel> = ['', ...PERIOD_FLOW_ORDER];

const schema: yup.ObjectSchema<Form> = yup
  .object({
    sensation: yup.number().min(SENSATION_MIN).max(SENSATION_MAX).required(),
    anxietyLevel: yup.number().min(ANXIETY_MIN).max(ANXIETY_MAX).required(),
    comment: yup.string().default(''),
    isPeriodDay: yup.boolean().required(),
    periodFlow: yup.mixed<'' | PeriodFlowLevel>().oneOf(PERIOD_FLOW_FORM_VALUES).default(''),
  })
  .required();

type Props = {
  date: string;
  initial?: DailyLogView | null;
  /** Appelé après une sauvegarde réussie (ex. rafraîchir l’historique). */
  onSaved?: () => void;
};

export function DailyLogForm({ date, initial, onSaved }: Props) {
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, isDirty },
  } = useForm<Form>({
    resolver: yupResolver(schema),
    defaultValues: {
      sensation: initial?.sensation ?? 0,
      anxietyLevel: initial?.anxietyLevel ?? 0,
      comment: initial?.comment ?? '',
      isPeriodDay: initial?.isPeriodDay ?? false,
      periodFlow: initial?.periodFlow ?? '',
    },
  });

  useEffect(() => {
    if (initial) {
      reset({
        sensation: initial.sensation,
        anxietyLevel: initial.anxietyLevel ?? 0,
        comment: initial.comment ?? '',
        isPeriodDay: initial.isPeriodDay,
        periodFlow: initial.periodFlow ?? '',
      });
    }
  }, [initial, reset]);

  const isPeriodDay = useWatch({ control, name: 'isPeriodDay' });

  useEffect(() => {
    if (isDirty) setSuccessToast(null);
  }, [isDirty]);

  const onSubmit = async (values: Form) => {
    setError(null);
    try {
      await saveDailyLog(date, {
        sensation: values.sensation,
        anxietyLevel: values.anxietyLevel,
        comment: values.comment || undefined,
        isPeriodDay: values.isPeriodDay,
        ...(values.isPeriodDay && values.periodFlow ? { periodFlow: values.periodFlow } : {}),
      });
      setSuccessToast(`Enregistré à ${new Date().toLocaleTimeString('fr-FR')}.`);
      reset(values);
      onSaved?.();
    } catch {
      setError('Impossible d’enregistrer pour le moment. Réessaie plus tard.');
    }
  };

  return (
    <Card variant="outlined" component="form" onSubmit={handleSubmit(onSubmit)}>
      <CardContent>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h6">Ressenti global</Typography>
            <Typography variant="body2" color="text.secondary">
              Échelle de {SENSATION_MIN} (douleur / mal-être) à {SENSATION_MAX} (bien-être). 0 =
              neutre.
            </Typography>
          </Stack>

          <Box>
            <Controller
              name="sensation"
              control={control}
              render={({ field }) => (
                <SensationSlider value={field.value} onChange={field.onChange} />
              )}
            />
          </Box>

          <Box>
            <Typography variant="h6">Niveau d’anxiété</Typography>
            <Controller
              name="anxietyLevel"
              control={control}
              render={({ field }) => (
                <AnxietySlider value={field.value} onChange={field.onChange} />
              )}
            />
          </Box>

          <Controller
            name="isPeriodDay"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch
                    checked={field.value}
                    onChange={(_, checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        setValue('periodFlow', '', { shouldDirty: true });
                      }
                    }}
                  />
                }
                label="Règles aujourd’hui"
              />
            )}
          />

          {isPeriodDay && (
            <Controller
              name="periodFlow"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel id="daily-log-period-flow-label">Intensité du flux</InputLabel>
                  <Select
                    {...field}
                    labelId="daily-log-period-flow-label"
                    label="Intensité du flux"
                    value={field.value}
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
            />
          )}

          <Divider sx={{ mx: -2, borderColor: 'divider' }} />

          <Controller
            name="comment"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Commentaire (optionnel)"
                multiline
                minRows={3}
                placeholder="Comment se sent ton corps aujourd’hui ?"
              />
            )}
          />

          {error && <Alert severity="error">{error}</Alert>}

          <AutoDismissSnackbar
            open={successToast !== null && !isDirty}
            message={successToast ?? ''}
            onClose={() => setSuccessToast(null)}
          />

          <Button type="submit" variant="contained" size="medium" disabled={isSubmitting} fullWidth>
            Enregistrer
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
