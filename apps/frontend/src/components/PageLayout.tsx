import { AppBar, Box, Container, Toolbar, Typography, Button, Stack } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/authSlice';

type Props = { title: string; children: React.ReactNode };

export function PageLayout({ title, children }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Diana
          </Typography>
          {user && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Button component={RouterLink} to="/" color="inherit">
                Aujourd’hui
              </Button>
              <Button component={RouterLink} to="/history" color="inherit">
                Historique
              </Button>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Button
                color="inherit"
                onClick={async () => {
                  await dispatch(logout());
                  navigate('/login');
                }}
              >
                Déconnexion
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        {children}
      </Container>
    </Box>
  );
}
