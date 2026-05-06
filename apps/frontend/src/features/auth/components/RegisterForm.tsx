import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Button, Stack, TextField } from '@mui/material';

const schema = yup.object({
  email: yup.string().email().required('Email requis'),
  password: yup.string().min(8, 'Au moins 8 caractères').required('Mot de passe requis'),
});

export type RegisterFormValues = yup.InferType<typeof schema>;

type Props = {
  error?: string | null;
  loading?: boolean;
  onSubmit: (values: RegisterFormValues) => Promise<void> | void;
  onClearError?: () => void;
};

export function RegisterForm({ error, loading, onSubmit, onClearError }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: yupResolver(schema) });

  useEffect(() => {
    onClearError?.();
  }, [onClearError]);

  return (
    <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        autoFocus
        {...register('email')}
        error={!!errors.email}
        helperText={errors.email?.message}
      />
      <TextField
        label="Mot de passe"
        type="password"
        autoComplete="new-password"
        {...register('password')}
        error={!!errors.password}
        helperText={errors.password?.message ?? '8 caractères minimum'}
      />
      <Button type="submit" variant="contained" size="large" disabled={isSubmitting || loading}>
        S’inscrire
      </Button>
    </Stack>
  );
}
