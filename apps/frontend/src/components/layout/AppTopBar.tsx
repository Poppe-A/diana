import { AppBar, Box, Button, IconButton, Stack, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks';
import { UserMenu } from './UserMenu';
import { useNavItems } from './navItems';

type Props = {
  onOpenDrawer: () => void;
};

export function AppTopBar({ onOpenDrawer }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  const items = useNavItems();

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ gap: 1 }}>
        {user && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Ouvrir le menu"
            onClick={onOpenDrawer}
            sx={{ display: { xs: 'inline-flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
          Diana
        </Typography>
        {user && (
          <>
            <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {items.map((item) => (
                <Button
                  key={item.to}
                  component={RouterLink}
                  to={item.to}
                  color="inherit"
                  startIcon={item.icon}
                  variant={location.pathname === item.to ? 'outlined' : 'text'}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
            <Box sx={{ display: { xs: 'none', md: 'inline-flex' } }}>
              <UserMenu />
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
