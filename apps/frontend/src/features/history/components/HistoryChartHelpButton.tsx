import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';

/** Au-delà de ce nombre de jours, le graphe active zoom + pan (et le paragraphe d’aide « zoom »). */
export const CHART_HELP_ZOOM_MIN_POINTS = 20;

type Props = {
  zoomActive: boolean;
};

export function HistoryChartHelpButton({ zoomActive }: Props) {
  return (
    <Tooltip
      title={
        <Box sx={{ py: 0.25, maxWidth: 288 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.75 }}>
            Lecture du graphe
          </Typography>
          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
            La courbe bleue indique ton ressenti du jour (−10 à +10). Survole ou pose le doigt sur
            un jour pour voir le détail ; un clic ouvre la saisie pour cette date.
          </Typography>
          <Typography variant="body2" component="div" sx={{ mb: 1 }}>
            Tu peux masquer ou afficher les bandes « jour de règles » et la courbe d’anxiété avec
            les interrupteurs sous la légende ; le ressenti reste toujours visible.
          </Typography>
          <Typography variant="body2" component="div" sx={{ mb: zoomActive ? 1 : 0 }}>
            Les bandes roses signalent les jours de règles : plus la bande est haute, plus le flux
            menstruel renseigné est important. La couleur ne change pas : seule la hauteur traduit
            l’intensité.
          </Typography>
          {zoomActive ? (
            <Typography variant="body2" component="div">
              Sur une longue période tu peux zoomer (pincement à deux doigts), faire défiler
              horizontalement ou utiliser le curseur sous le graphe.
            </Typography>
          ) : null}
        </Box>
      }
      arrow
      placement="bottom"
      enterTouchDelay={0}
      leaveTouchDelay={4000}
      slotProps={{ tooltip: { sx: { maxWidth: 320 } } }}
    >
      <IconButton
        color="inherit"
        aria-label="Aide sur la lecture du graphe"
        sx={{
          color: 'text.secondary',
          p: 1,
          '&:hover': { bgcolor: 'action.hover' },
        }}
      >
        <HelpOutlineIcon sx={{ fontSize: 30 }} />
      </IconButton>
    </Tooltip>
  );
}
