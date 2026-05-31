import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { useEffect } from 'react';
import { theme } from './theme';
import { useAppDispatch, useAppSelector } from './hooks';
import { fetchMe } from './store/authSlice';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dailyLog/DashboardPage';
import { HistoryPage } from './features/history/HistoryPage';
import { EventsPage } from './features/events/EventsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

function AuthBootstrap() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(fetchMe());
  }, [dispatch]);

  return null;
}

function AppRoutes() {
  const user = useAppSelector((s) => s.auth.user);

  return (
    <>
      <AuthBootstrap />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/events" element={<EventsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export function AppRouter() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
