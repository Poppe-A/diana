import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Alert,
  Button,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { PageLayout } from '../../components/PageLayout';
import { api } from '../../api/client';

dayjs.extend(localizedFormat);
dayjs.locale('fr');

const SENSATION_MIN = -10;
const SENSATION_MAX = 10;

export type DailyLogView = {
  id: number;
  date: string;
  sensation: number;
  comment: string | null;
  isPeriodDay: boolean;
};

type Form = {
  sensation: number;
  comment: string;
  isPeriodDay: boolean;
};

const schema: yup.ObjectSchema<Form> = yup
  .object({
    sensation: yup.number().min(SENSATION_MIN).max(SENSATION_MAX).required(),
    comment: yup.string().default(''),
    isPeriodDay: yup.boolean().required(),
  })
  .required();

const sensationMarks = [-10, -5, 0, 5, 10].map((value) => ({ value, label: `${value}` }));

export function DashboardPage() {
  const today = dayjs().format('YYYY-MM-DD');
  const title = dayjs().format('dddd D MMMM');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: yupResolver(schema),
    defaultValues: { sensation: 0, comment: '', isPeriodDay: false },
  });

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<DailyLogView | null>('/daily-logs/today');
        if (data) {
          reset({
            sensation: data.sensation,
            comment: data.comment ?? '',
            isPeriodDay: data.isPeriodDay,
          });
        }
      } catch {
        /* ignore */
      }
    })();
  }, [reset]);

  const onSubmit = async (values: Form) => {
    await api.put(`/daily-logs/${today}`, {
      sensation: values.sensation,
      comment: values.comment || undefined,
      isPeriodDay: values.isPeriodDay,
    });
  };

  return (
    <PageLayout title={title}>
      <Stack spacing={3} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="body1" color="text.secondary">
          Ressenti du jour : <strong>négatif</strong> = douleur / mal-être, <strong>positif</strong> =
          bien-être (échelle de {SENSATION_MIN} à {SENSATION_MAX}, 0 = neutre).
        </Typography>
        <Stack direction="row" justifyContent="space-between" sx={{ px: 0.5 }}>
          <Typography variant="caption" color="error.main">
            Douleur / mal-être
          </Typography>
          <Typography variant="caption" color="success.main">
            Bien-être
          </Typography>
        </Stack>
        <Controller
          name="sensation"
          control={control}
          render={({ field }) => (
            <Slider
              valueLabelDisplay="on"
              step={1}
              marks={sensationMarks}
              min={SENSATION_MIN}
              max={SENSATION_MAX}
              value={field.value}
              onChange={(_, v) => field.onChange(v as number)}
              sx={{
                '& .MuiSlider-track': {
                  background:
                    'linear-gradient(90deg, rgb(211, 47, 47) 0%, rgb(158, 158, 158) 50%, rgb(56, 142, 60) 100%)',
                  border: 'none',
                },
              }}
            />
          )}
        />
        <Controller
          name="comment"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Commentaire (optionnel)" multiline minRows={3} />
          )}
        />
        <Controller
          name="isPeriodDay"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch checked={field.value} onChange={(_, c) => field.onChange(c)} />}
              label="Règles aujourd’hui"
            />
          )}
        />
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          Enregistrer
        </Button>
        <Alert severity="info">
          Une seule entrée par jour : si tu enregistres à nouveau, la journée est mise à jour.
        </Alert>
      </Stack>
    </PageLayout>
  );
}
