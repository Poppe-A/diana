import DisplaySettings from '@mui/icons-material/FilterList';
import {
  Checkbox,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';

/** Même violet que l’onglet actif du menu bas (BottomNav). */
const CHART_ACCENT_VIOLET = '#4A148C';

type DisplayOption = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  visible: boolean;
};

type Props = {
  options: DisplayOption[];
  footerOptions?: DisplayOption[];
};

function renderOptionItems(items: DisplayOption[]) {
  return items.map((option) => (
    <MenuItem key={option.id} dense onClick={() => option.onChange(!option.checked)}>
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
  ));
}

export function HistoryChartDisplayMenu({ options, footerOptions = [] }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const visibleOptions = options.filter((o) => o.visible);
  const visibleFooter = footerOptions.filter((o) => o.visible);
  const allVisible = [...visibleOptions, ...visibleFooter];

  if (allVisible.length === 0) return null;

  const activeCount = allVisible.filter((o) => o.checked).length;

  return (
    <>
      <Tooltip title="Affichage du graphe">
        <IconButton
          size="large"
          aria-label="Réglages d’affichage du graphe"
          aria-controls={open ? 'history-chart-display-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            flexShrink: 0,
            width: 48,
            height: 48,
            color: open ? CHART_ACCENT_VIOLET : 'text.secondary',
            border: '2px solid currentColor',
            '&:hover': {
              bgcolor: 'transparent',
            },
          }}
        >
          <DisplaySettings sx={{ fontSize: 34 }} />
        </IconButton>
      </Tooltip>
      <Menu
        id="history-chart-display-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: { sx: { minWidth: 220, maxWidth: 'calc(100vw - 24px)' } },
        }}
      >
        <MenuItem disabled dense sx={{ opacity: 1, minHeight: 36 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            Affichage ({activeCount}/{allVisible.length})
          </Typography>
        </MenuItem>
        {renderOptionItems(visibleOptions)}
        {visibleFooter.length > 0 ? (
          <Divider key="chart-display-footer-divider" sx={{ my: 0.5 }} />
        ) : null}
        {visibleFooter.length > 0 ? renderOptionItems(visibleFooter) : null}
      </Menu>
    </>
  );
}
