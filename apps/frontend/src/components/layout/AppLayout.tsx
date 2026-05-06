import { useState } from 'react';
import { Box, Container } from '@mui/material';
import { useAppSelector } from '../../hooks';
import { AppTopBar } from './AppTopBar';
import { AppDrawer } from './AppDrawer';
import { BottomNav } from './BottomNav';
import { PageHeader } from './PageHeader';

type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
};

export function AppLayout({ title, subtitle, action, maxWidth = 'sm', children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        width: '100%',
        maxWidth: '100%',
        overflowX: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <AppTopBar onOpenDrawer={() => setDrawerOpen(true)} />
      {user && <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      <Box
        component="main"
        sx={{
          flex: 1,
          pb: {
            xs: user ? 'calc(72px + env(safe-area-inset-bottom))' : 4,
            md: 4,
          },
        }}
      >
        <Container maxWidth={maxWidth} sx={{ py: { xs: 2, sm: 4 } }}>
          <PageHeader title={title} subtitle={subtitle} action={action} />
          {children}
        </Container>
      </Box>
      {user && <BottomNav />}
    </Box>
  );
}
