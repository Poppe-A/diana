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
import { useCallback, useEffect, useRef, useState } from 'react';
import { AutoDismissSnackbar } from '../../../components/AutoDismissSnackbar';
import { AnxietySlider } from './AnxietySlider';
import { SleepSlider } from './SleepSlider';
import { SensationSlider } from './SensationSlider';
import {
  ANXIETY_MAX,
  ANXIETY_MIN,
  PERIOD_FLOW_LABELS,
  PERIOD_FLOW_ORDER,
  PeriodFlowLevel,
  SENSATION_MAX,
  SENSATION_MIN,
  SLEEP_QUALITY_MAX,
  SLEEP_QUALITY_MIN,
  type DailyLogView,
} from '../types';
import { saveDailyLog } from '../api';
import { draftFromLog, draftToSavePayload, type DailyLogDraft } from '../dailyLogPayload';

type Form = DailyLogDraft;

const PERIOD_FLOW_FORM_VALUES: Array<'' | PeriodFlowLevel> = ['', ...PERIOD_FLOW_ORDER];

const schema: yup.ObjectSchema<Form> = yup
  .object({
    sensation: yup.number().min(SENSATION_MIN).max(SENSATION_MAX).required(),
    anxietyLevel: yup.number().min(ANXIETY_MIN).max(ANXIETY_MAX).required(),
    sleepQuality: yup.number().min(SLEEP_QUALITY_MIN).max(SLEEP_QUALITY_MAX).required(),
    comment: yup.string().default(''),
    isPeriodDay: yup.boolean().required(),
    periodFlow: yup.mixed<'' | PeriodFlowLevel>().oneOf(PERIOD_FLOW_FORM_VALUES).default(''),
  })
  .required();

function formSnapshot(values: Form): string {
  return JSON.stringify({
    sensation: values.sensation,
    anxietyLevel: values.anxietyLevel,
    sleepQuality: values.sleepQuality,
    comment: values.comment,
    isPeriodDay: values.isPeriodDay,
    periodFlow: values.periodFlow,
  });
}

type Props = {
  date: string;
  initial?: DailyLogView | null;
  /** Log renvoyé par l’API après sauvegarde — mise à jour du state parent, sans reload. */
  onLogUpdated?: (log: DailyLogView) => void;
  /** Uniquement après « Enregistrer le commentaire » (ex. fermer la modale). */
  onCommentSaved?: () => void;
};

export function DailyLogForm({ date, initial, onLogUpdated, onCommentSaved }: Props) {
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const persistInFlightRef = useRef(false);

  const defaultFormValues = draftFromLog(initial);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { isSubmitting, isDirty, dirtyFields },
  } = useForm<Form>({
    resolver: yupResolver(schema),
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    const values = draftFromLog(initial);
    reset(values);
    lastSavedSnapshotRef.current = initial ? formSnapshot(values) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- resync seulement au changement de date
  }, [date, reset]);

  const isPeriodDay = useWatch({ control, name: 'isPeriodDay' });
  const commentValue = useWatch({ control, name: 'comment' });

  useEffect(() => {
    if (isDirty) setSuccessToast(null);
  }, [isDirty]);

  const persist = useCallback(
    async (values: Form, options: { afterComment?: boolean }) => {
      setError(null);
      try {
        const saved = await saveDailyLog(date, draftToSavePayload(values));
        const synced = draftFromLog(saved);
        setSuccessToast(`Enregistré à ${new Date().toLocaleTimeString('fr-FR')}.`);
        lastSavedSnapshotRef.current = formSnapshot(synced);
        reset(synced);
        onLogUpdated?.(saved);
        if (options.afterComment) {
          onCommentSaved?.();
        }
      } catch {
        setError('Impossible d’enregistrer pour le moment. Réessaie plus tard.');
      }
    },
    [date, onCommentSaved, onLogUpdated, reset],
  );

  const persistCurrentIfChanged = useCallback(async () => {
    const values = getValues();
    const snapshot = formSnapshot(values);
    if (lastSavedSnapshotRef.current === snapshot) return;
    if (persistInFlightRef.current) return;

    persistInFlightRef.current = true;
    setAutoSaving(true);
    try {
      await persist(values, {});
    } finally {
      persistInFlightRef.current = false;
      setAutoSaving(false);
    }
  }, [getValues, persist]);

  const onSubmitComment = async (values: Form) => {
    await persist(values, { afterComment: true });
  };

  const saving = isSubmitting || autoSaving;
  const commentDirty = Boolean(dirtyFields.comment);
  const canSaveComment =
    commentDirty || (!initial && commentValue.trim().length > 0);

  return (
    <Card variant="outlined" component="form" onSubmit={handleSubmit(onSubmitComment)}>
      <CardContent>
        <Stack spacing={3}>
          <Stack spacing={0.5}>
            <Typography variant="h6">Ressenti global</Typography>
            <Typography variant="caption" color="text.secondary">
              Les curseurs sont enregistrés dès que tu relâches le bouton.
            </Typography>
          </Stack>

          <Box>
            <Controller
              name="sensation"
              control={control}
              render={({ field }) => (
                <SensationSlider
                  value={field.value}
                  onChange={field.onChange}
                  onChangeCommitted={() => void persistCurrentIfChanged()}
                />
              )}
            />
          </Box>

          <Box>
            <Typography variant="h6">Niveau d’anxiété</Typography>
            <Controller
              name="anxietyLevel"
              control={control}
              render={({ field }) => (
                <AnxietySlider
                  value={field.value}
                  onChange={field.onChange}
                  onChangeCommitted={() => void persistCurrentIfChanged()}
                />
              )}
            />
          </Box>

          <Box>
            <Typography variant="h6">Sommeil</Typography>
            <Controller
              name="sleepQuality"
              control={control}
              render={({ field }) => (
                <SleepSlider
                  value={field.value}
                  onChange={field.onChange}
                  onChangeCommitted={() => void persistCurrentIfChanged()}
                />
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
                    disabled={saving}
                    onChange={(_, checked) => {
                      field.onChange(checked);
                      if (!checked) {
                        setValue('periodFlow', '', { shouldDirty: true });
                      }
                      void Promise.resolve().then(() => persistCurrentIfChanged());
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
                    disabled={saving}
                    labelId="daily-log-period-flow-label"
                    label="Intensité du flux"
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      void Promise.resolve().then(() => persistCurrentIfChanged());
                    }}
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

          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={saving || !canSaveComment}
            fullWidth
          >
            Enregistrer le commentaire
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
