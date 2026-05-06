import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavItems } from './navItems';

export function BottomNav() {
  const items = useNavItems();
  const location = useLocation();
  const navigate = useNavigate();

  const current = items.findIndex((it) => it.to === location.pathname);

  return (
    <Paper
      elevation={8}
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: { xs: 'block', md: 'none' },
        /** Au-dessus du contenu scrollable ; sous les modales MUI (1300) */
        zIndex: (theme) => theme.zIndex.appBar + 1,
        borderTop: '1px solid',
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={current === -1 ? false : current}
        onChange={(_, newValue: number) => {
          const item = items[newValue];
          if (item) navigate(item.to);
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction key={item.to} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
