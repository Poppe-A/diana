import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, IconButton, Popover, Typography } from '@mui/material';
import { useState } from 'react';

/** Au-delà de ce nombre de jours, le graphe active zoom + pan (et le paragraphe d’aide « zoom »). */
export const CHART_HELP_ZOOM_MIN_POINTS = 20;

type Props = {
  zoomActive: boolean;
};

function HelpContent({ zoomActive }: { zoomActive: boolean }) {
  return (
    <Box sx={{ p: 2, maxWidth: 288 }}>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
        Lecture du graphe
      </Typography>
      <Typography variant="body2" component="div" sx={{ mb: 1 }}>
        La courbe verte indique ton ressenti du jour (0 à 10). Survole ou pose le doigt sur un jour
        pour voir le détail ; un clic ouvre la saisie pour cette date.
      </Typography>
      <Typography variant="body2" component="div" sx={{ mb: 1 }}>
        Tu peux masquer ou afficher les bandes « jour de règles » et la courbe d’anxiété avec les
        interrupteurs sous la légende ; le ressenti reste toujours visible.
      </Typography>
      <Typography variant="body2" component="div" sx={{ mb: zoomActive ? 1 : 0 }}>
        Les bandes roses signalent les jours de règles : plus la bande est haute, plus le flux
        menstruel renseigné est important. La couleur ne change pas : seule la hauteur traduit
        l’intensité.
      </Typography>
      {zoomActive ? (
        <Typography variant="body2" component="div">
          Au chargement, toute la période est visible depuis le début (à gauche). Pince à deux doigts
          sur le graphe pour zoomer (le curseur « Détail » suit) ; une fois zoomé, fais glisser
          horizontalement pour parcourir le temps.
        </Typography>
      ) : null}
    </Box>
  );
}

export function HistoryChartHelpButton({ zoomActive }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="Aide sur la lecture du graphe"
        aria-haspopup="dialog"
        aria-expanded={open ? 'true' : 'false'}
        aria-controls={open ? 'history-chart-help-popover' : undefined}
        onClick={(event) => setAnchorEl(open ? null : event.currentTarget)}
        sx={{
          color: 'text.secondary',
          p: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 30 }} />
      </IconButton>
      <Popover
        id="history-chart-help-popover"
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: { maxWidth: 320, mt: 0.5 },
          },
        }}
      >
        <HelpContent zoomActive={zoomActive} />
      </Popover>
    </>
  );
}
