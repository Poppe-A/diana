import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Alert, Button, Stack, TextField, Typography, Link } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { clearError, login } from '../../store/authSlice';
import { useEffect } from 'react';

const schema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
});

type Form = yup.InferType<typeof schema>;

export function LoginPage() {
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
    await dispatch(login(data)).unwrap();
    navigate('/');
  };

  return (
    <Stack spacing={3} maxWidth={400} mx="auto" mt={6}>
      <Typography variant="h4">Connexion</Typography>
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
            Se connecter
          </Button>
        </Stack>
      </form>
      <Typography variant="body2">
        Pas de compte ? <Link component={RouterLink} to="/register">Créer un compte</Link>
      </Typography>
    </Stack>
  );
}
