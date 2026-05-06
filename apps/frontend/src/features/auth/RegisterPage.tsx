import { useCallback } from 'react';
import { Link } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { clearError, register as registerAccount } from '../../store/authSlice';
import { RegisterForm, type RegisterFormValues } from './components/RegisterForm';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector((s) => s.auth.error);

  const handleClearError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleSubmit = async (values: RegisterFormValues) => {
    await dispatch(registerAccount(values)).unwrap();
    navigate('/login');
  };

  return (
    <AuthLayout
      title="Créer un compte"
      subtitle="Commence à suivre tes ressentis dès aujourd’hui"
      footer={
        <>
          Déjà un compte ?{' '}
          <Link component={RouterLink} to="/login">
            Connexion
          </Link>
        </>
      }
    >
      <RegisterForm error={error} onSubmit={handleSubmit} onClearError={handleClearError} />
    </AuthLayout>
  );
}
