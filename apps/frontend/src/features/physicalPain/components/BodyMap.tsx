import { Box } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import type { BodyZone, BodyZoneView } from '../types';
import FrontSilhouette from './silhouette-front.svg?react';
import BackSilhouette from './silhouette-back.svg?react';

type Props = {
  view: BodyZoneView;
  zones: BodyZone[];
  /** Intensité (1..10) par code de zone. Une zone absente = pas de douleur. */
  intensityByZoneCode: Record<string, number>;
  onZoneClick: (zoneCode: string) => void;
};

const PAIN_INTENSITY_MIN = 1;
const PAIN_INTENSITY_MAX = 10;
const PAIN_ALPHA_MIN = 0.18;
const PAIN_ALPHA_MAX = 0.7;
const HOVER_ALPHA_BOOST = 0.12;

function alphaFromIntensity(intensity: number) {
  const clamped = Math.max(PAIN_INTENSITY_MIN, Math.min(PAIN_INTENSITY_MAX, intensity));
  const ratio = (clamped - PAIN_INTENSITY_MIN) / (PAIN_INTENSITY_MAX - PAIN_INTENSITY_MIN);
  return PAIN_ALPHA_MIN + ratio * (PAIN_ALPHA_MAX - PAIN_ALPHA_MIN);
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function withAlpha(hexColor: string, alpha: number) {
  // very small helper: accept #RRGGBB only (MUI theme primary.main is usually this)
  const a = Math.round(clamp01(alpha) * 255)
    .toString(16)
    .padStart(2, '0');
  if (/^#[0-9a-fA-F]{6}$/.test(hexColor)) return `${hexColor}${a}`;
  return hexColor;
}

// We render the user-provided SVGs (front/back) and target zones by their IDs.
// Each coarse zoneCode can correspond to one or multiple SVG paths.
//
// Front SVG IDs (from `silhouette-front.svg`): full-front, head-front, torso-front,
// left-arm-front, right-arm-front, left-leg-front, right-leg-front
// Back SVG IDs  (from `silhouette-back.svg`):  full-back, head-back, torso-back,
// left-arm-back, right-arm-back, left-leg-back, right-leg-back

const ZONE_IDS_BY_CODE: Record<string, string[]> = {
  head_front: ['head-front'],
  torso_front: ['torso-front'],
  left_arm_front: ['left-arm-front'],
  right_arm_front: ['right-arm-front'],
  left_leg_front: ['left-leg-front'],
  right_leg_front: ['right-leg-front'],

  head_back: ['head-back'],
  torso_back: ['torso-back'],
  left_arm_back: ['left-arm-back'],
  right_arm_back: ['right-arm-back'],
  left_leg_back: ['left-leg-back'],
  right_leg_back: ['right-leg-back'],
};

export function BodyMap({ view, zones, intensityByZoneCode, onZoneClick }: Props) {
  const theme = useTheme();
  const [hovered, setHovered] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const viewZones = useMemo(
    () => zones.filter((z) => z.view === view),
    [zones, view],
  );

  // Couleurs de base : palette `error` (rouge) pour les zones douloureuses,
  // `primary` pour le simple survol d’une zone non sélectionnée.
  const errorMain = theme.palette.error.main;
  const hoverFill = withAlpha(theme.palette.primary.main, 0.2);

  const fillByZoneCode = useMemo(() => {
    const out: Record<string, string> = {};
    for (const z of viewZones) {
      const intensity = intensityByZoneCode[z.code];
      const isSelected = typeof intensity === 'number';
      const isHovered = hovered === z.code;

      if (isSelected) {
        const baseAlpha = alphaFromIntensity(intensity);
        const alpha = isHovered
          ? Math.min(1, baseAlpha + HOVER_ALPHA_BOOST)
          : baseAlpha;
        out[z.code] = withAlpha(errorMain, alpha);
      } else {
        out[z.code] = isHovered ? hoverFill : 'transparent';
      }
    }
    return out;
  }, [errorMain, hoverFill, hovered, intensityByZoneCode, viewZones]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Ensure contour is black (and non interactive).
    const fullId = view === 'front' ? 'full-front' : 'full-back';
    const full = svg.querySelector<SVGElement>(`#${CSS.escape(fullId)}`);
    if (full) {
      full.style.stroke = '#000';
      full.style.strokeOpacity = '1';
      full.style.fill = 'none';
      full.style.pointerEvents = 'none';
    }

    // Apply fill/stroke to each zone element by id.
    for (const zone of viewZones) {
      const ids = ZONE_IDS_BY_CODE[zone.code] ?? [];
      // Important for hover: keep a painted fill (transparent) so the element receives pointer events.
      const fill = fillByZoneCode[zone.code] ?? 'transparent';

      for (const id of ids) {
        const el = svg.querySelector<SVGElement>(`#${CSS.escape(id)}`);
        if (!el) continue;

        el.style.fill = fill === 'transparent' ? 'transparent' : fill;
        // Don't set fillOpacity to 0: that breaks hit-testing on many browsers.
        el.style.fillOpacity = '1';
        // zones have no outline; only fill indicates state
        el.style.stroke = 'none';
        el.style.strokeWidth = '0';
        el.style.cursor = 'pointer';
        el.style.pointerEvents = 'all';

        // Bind listeners only once per element.
        if (el.getAttribute('data-pain-bound') === '1') continue;
        el.setAttribute('data-pain-bound', '1');
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', zone.label);

        el.addEventListener('mouseenter', () => setHovered(zone.code));
        el.addEventListener('mouseleave', () =>
          setHovered((previousHoveredCode) =>
            previousHoveredCode === zone.code ? null : previousHoveredCode,
          ),
        );
        el.addEventListener('focus', () => setHovered(zone.code));
        el.addEventListener('blur', () =>
          setHovered((previousHoveredCode) =>
            previousHoveredCode === zone.code ? null : previousHoveredCode,
          ),
        );
        el.addEventListener('click', () => onZoneClick(zone.code));
        el.addEventListener('keydown', (e) => {
          const ke = e as KeyboardEvent;
          if (ke.key === 'Enter' || ke.key === ' ') {
            ke.preventDefault();
            onZoneClick(zone.code);
          }
        });
      }
    }
  }, [fillByZoneCode, onZoneClick, view, viewZones]);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'visible',
        // Largeur du Card + plafond de hauteur : le SVG garde le ratio du viewBox (`meet`) sans rogner.
        '& > svg': {
          display: 'block',
          width: '100%',
          maxWidth: '100%',
          aspectRatio: '286 / 651',
          height: 'auto',
          maxHeight: 'clamp(340px, 70vh, 720px)',
          // Décalage optique : le dessin reste un peu à gauche du cadre du viewBox une fois scalé.
          transform: 'translateX(4%)',
        },
        // Pas d’anneau de focus natif sur les zones cliquables :
        // le retour visuel est déjà assuré par le changement de couleur (hover/focus).
        '& svg [data-pain-bound]:focus, & svg [data-pain-bound]:focus-visible': {
          outline: 'none',
        },
      }}
    >
      {view === 'front' ? (
        <FrontSilhouette
          ref={svgRef}
          role="img"
          aria-label="Schéma du corps (vue de face)"
        />
      ) : (
        <BackSilhouette
          ref={svgRef}
          role="img"
          aria-label="Schéma du corps (vue de dos)"
        />
      )}
    </Box>
  );
}

