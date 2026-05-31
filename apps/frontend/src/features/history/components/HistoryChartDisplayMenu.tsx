import TuneIcon from '@mui/icons-material/Tune';
import {
  Checkbox,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState } from 'react';

/** Même violet que l’onglet actif du menu bas (BottomNav). */
export const CHART_ACCENT_VIOLET = '#4A148C';

type DisplayOption = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  visible: boolean;
};

type Props = {
  options: DisplayOption[];
};

export function HistoryChartDisplayMenu({ options }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const visibleOptions = options.filter((o) => o.visible);

  if (visibleOptions.length === 0) return null;

  const activeCount = visibleOptions.filter((o) => o.checked).length;

  return (
    <>
      <Tooltip title="Affichage du graphe">
        <IconButton
          size="medium"
          aria-label="Réglages d’affichage du graphe"
          aria-controls={open ? 'history-chart-display-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            flexShrink: 0,
            width: 44,
            height: 44,
            color: CHART_ACCENT_VIOLET,
            border: `1px solid ${alpha(CHART_ACCENT_VIOLET, 0.45)}`,
            '&:hover': {
              bgcolor: 'transparent',
              borderColor: CHART_ACCENT_VIOLET,
            },
          }}
        >
          <TuneIcon sx={{ fontSize: 26 }} />
        </IconButton>
      </Tooltip>
      <Menu
        id="history-chart-display-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { sx: { minWidth: 220, maxWidth: 'calc(100vw - 24px)' } },
        }}
      >
        <MenuItem disabled dense sx={{ opacity: 1, minHeight: 36 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Affichage ({activeCount}/{visibleOptions.length})
          </Typography>
        </MenuItem>
        {visibleOptions.map((option) => (
          <MenuItem
            key={option.id}
            dense
            onClick={() => option.onChange(!option.checked)}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              <Checkbox
                edge="start"
                size="small"
                checked={option.checked}
                tabIndex={-1}
                disableRipple
                inputProps={{ 'aria-label': option.label }}
              />
            </ListItemIcon>
            <ListItemText primary={option.label} primaryTypographyProps={{ variant: 'body2' }} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
