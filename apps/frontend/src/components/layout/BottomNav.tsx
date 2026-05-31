import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNavItems } from './navItems';

/** Violet plus saturé que primary.main (#6b4e71) pour l’onglet actif du menu bas. */
const BOTTOM_NAV_ACTIVE_COLOR = '#4A148C';

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
        sx={{
          '& .MuiBottomNavigationAction-root': {
            color: 'text.secondary',
            opacity: 0.72,
            transition: 'color 0.2s ease, opacity 0.2s ease',
          },
          '& .MuiBottomNavigationAction-root.Mui-selected': {
            color: BOTTOM_NAV_ACTIVE_COLOR,
            opacity: 1,
          },
          '& .MuiBottomNavigationAction-label': {
            fontSize: '0.7rem',
          },
          '& .MuiBottomNavigationAction-label.Mui-selected': {
            fontSize: '0.75rem',
            fontWeight: 700,
          },
          '& .MuiBottomNavigationAction-root .MuiSvgIcon-root': {
            fontSize: '1.65rem',
            transition: 'transform 0.2s ease, color 0.2s ease',
          },
          '& .MuiBottomNavigationAction-root.Mui-selected .MuiSvgIcon-root': {
            transform: 'scale(1.12)',
          },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction key={item.to} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
