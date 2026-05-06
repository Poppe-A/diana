import { useCallback } from 'react';
import { Link } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { clearError, login } from '../../store/authSlice';
import { LoginForm, type LoginFormValues } from './components/LoginForm';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector((s) => s.auth.error);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (values: LoginFormValues) => {
    await dispatch(login(values)).unwrap();
    navigate('/');
  };

  return (
    <AuthLayout
      title="Connexion"
      subtitle="Heureux de te revoir"
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link component={RouterLink} to="/register">
            Créer un compte
          </Link>
        </>
      }
    >
      <LoginForm error={error} onSubmit={handleSubmit} onClearError={handleClearError} />
    </AuthLayout>
  );
}
