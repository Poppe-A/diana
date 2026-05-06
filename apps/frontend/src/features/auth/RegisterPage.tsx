import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Button, Link, Stack, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { clearError, register as registerAccount } from '../../store/authSlice';
import { useEffect } from 'react';

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8, 'Au moins 8 caractères').required(),
});

type Form = yup.InferType<typeof schema>;

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector((s) => s.auth.error);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: yupResolver(schema) });

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const onSubmit = async (data: Form) => {
    await dispatch(registerAccount(data)).unwrap();
    navigate('/login');
  };

  return (
    <Stack spacing={3} maxWidth={400} mx="auto" mt={6}>
      <Typography variant="h4">Créer un compte</Typography>
      {error && <Alert severity="error">{error}</Alert>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2}>
          <TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
          <TextField
            label="Mot de passe"
            type="password"
            {...register('password')}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          <Button type="submit" variant="contained" disabled={isSubmitting} size="large">
            S’inscrire
          </Button>
        </Stack>
      </form>
      <Typography variant="body2">
        Déjà un compte ? <Link component={RouterLink} to="/login">Connexion</Link>
      </Typography>
    </Stack>
  );
}
