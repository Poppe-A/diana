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

export type DailyLogView = {
  id: number;
  date: string;
  painLevel: number;
  comment: string | null;
  isPeriodDay: boolean;
};

const schema = yup.object({
  painLevel: yup.number().min(0).max(10).required(),
  comment: yup.string().optional(),
  isPeriodDay: yup.boolean().required(),
});

type Form = yup.InferType<typeof schema>;

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
    defaultValues: { painLevel: 0, comment: '', isPeriodDay: false },
  });

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await api.get<DailyLogView | null>('/daily-logs/today');
        if (data) {
          reset({
            painLevel: data.painLevel,
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
      painLevel: values.painLevel,
      comment: values.comment || undefined,
      isPeriodDay: values.isPeriodDay,
    });
  };

  return (
    <PageLayout title={title}>
      <Stack spacing={3} component="form" onSubmit={handleSubmit(onSubmit)}>
        <Typography variant="body1" color="text.secondary">
          Niveau de douleur aujourd’hui (0 = aucune, 10 = maximale)
        </Typography>
        <Controller
          name="painLevel"
          control={control}
          render={({ field }) => (
            <Slider
              valueLabelDisplay="on"
              step={1}
              marks
              min={0}
              max={10}
              value={field.value}
              onChange={(_, v) => field.onChange(v as number)}
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
