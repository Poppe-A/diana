import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Box,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Theme } from '@mui/material/styles';
import {
  ChartsReferenceLine,
  ChartsTooltipCell,
  ChartsTooltipContainer,
  ChartsTooltipPaper,
  ChartsTooltipRow,
  ChartsTooltipTable,
  useAxesTooltip,
  useDrawingArea,
  useXAxis,
  useXScale,
} from '@mui/x-charts';
import { useChartContext } from '@mui/x-charts/context/ChartProvider';
import { AnimatedLine, LineChart } from '@mui/x-charts/LineChart';
import type { AnimatedLineProps } from '@mui/x-charts/LineChart';
import { chartsTooltipClasses } from '@mui/x-charts/ChartsTooltip';
import dayjs from 'dayjs';
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ComponentProps } from 'react';
import type { LineItemIdentifier } from '@mui/x-charts/models';
import { PERIOD_FLOW_LABELS, type DailyLogView, type PeriodFlowLevel } from '../../dailyLog/types';

type Props = {
  logs: DailyLogView[];
  onSelectDate?: (date: string) => void;
};

/** Au-delà de ce nombre de jours, zoom + pan sur l’axe X (Y reste −10…10). `filterMode: keep` pour garder les indices alignés avec `logs`. */
const TIMELINE_ZOOM_MIN_POINTS = 20;

/** Anxiété saisie sur 0…10, même axe vertical que le ressenti : 0 → −10, 10 → +10 (linéaire). */
function anxietyLevelToChartY(anxiety01To10: number): number {
  const x = Math.min(10, Math.max(0, anxiety01To10));
  return -10 + (x / 10) * 20;
}

/** Épaisseur invisible de la zone cliquable autour de la courbe (SVG stroke). */
const LINE_HIT_STROKE_PX = 18;

function svgEventPoint(svg: SVGSVGElement, event: React.MouseEvent): { x: number; y: number } {
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const mapped = pt.matrixTransform(ctm.inverse());
  return { x: mapped.x, y: mapped.y };
}

/** Équivalent « band » de `getAxisIndex` MUI pour l’axe X des dates (sans importer les internals). */
function bandXAxisDataIndex(
  scale: { bandwidth: () => number; step: () => number; range: () => Iterable<number> },
  axisLength: number,
  pointerX: number,
  reverse?: boolean,
): number {
  const step = scale.step();
  const rangeArr = Array.from(scale.range());
  const rangeMin = Math.min(...rangeArr);
  const rawIndex =
    scale.bandwidth() === 0
      ? Math.floor((pointerX - rangeMin + step / 2) / step)
      : Math.floor((pointerX - rangeMin) / step);
  if (rawIndex < 0 || rawIndex >= axisLength) return -1;
  return reverse ? axisLength - 1 - rawIndex : rawIndex;
}

const LineInteractionContext = createContext<{
  logs: DailyLogView[];
  onSelectDate?: (date: string) => void;
} | null>(null);

/**
 * Courbe visible inchangée + trace transparente épaisse pour le pointeur (tooltip + clic jour).
 * Le clic résout le dataIndex via la position X (onLineClick seul ne fournit pas d’index).
 */
function WideHitAnimatedLine(props: AnimatedLineProps) {
  const ctx = useContext(LineInteractionContext);
  const xAxisConfig = useXAxis<'band'>();
  const { instance } = useChartContext();

  const {
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    onClick,
    cursor,
    ownerState,
    d,
    skipAnimation,
    ...animatedLineRest
  } = props;

  void onClick;

  const handleHitPointerDown = onPointerDown;

  const handleHitClick = useCallback(
    (event: React.MouseEvent<SVGPathElement>) => {
      if (!ctx?.onSelectDate || ctx.logs.length === 0) return;
      const svg = event.currentTarget.ownerSVGElement;
      if (!svg) return;
      const pt = svgEventPoint(svg, event);
      if (!instance.isPointInside(pt.x, pt.y)) return;

      const axisData = xAxisConfig.data;
      if (!axisData?.length) return;
      const dataIndex = bandXAxisDataIndex(
        xAxisConfig.scale as Parameters<typeof bandXAxisDataIndex>[0],
        axisData.length,
        pt.x,
        xAxisConfig.reverse,
      );
      if (dataIndex < 0 || dataIndex >= ctx.logs.length) return;

      ctx.onSelectDate(ctx.logs[dataIndex].date);
    },
    [ctx, instance, xAxisConfig],
  );

  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={LINE_HIT_STROKE_PX}
        strokeLinecap="round"
        strokeLinejoin="round"
        pointerEvents="stroke"
        style={{
          cursor:
            cursor === undefined || typeof cursor === 'number'
              ? undefined
              : (cursor as React.CSSProperties['cursor']),
        }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={handleHitPointerDown}
        onClick={handleHitClick}
      />
      <AnimatedLine
        ownerState={ownerState}
        d={d}
        skipAnimation={skipAnimation}
        {...animatedLineRest}
        pointerEvents="none"
      />
    </g>
  );
}

/** Fraction de la hauteur utile du graphe (1 = très faible → 5 = très important). Flux non renseigné : visuel « moyen ». */
function periodFlowHeightFraction(flow: PeriodFlowLevel | null): number {
  if (flow === null) return 3 / 5;
  if (flow < 1 || flow > 5) return 3 / 5;
  return flow / 5;
}

/** Remplissage des bandes « jour de règles » (couleur unique ; seule la hauteur varie avec le flux). */
function periodBandFill(theme: Theme): string {
  return alpha(theme.palette.error.light, 0.22);
}

function ChartLegendHelpTooltip({ zoomActive }: { zoomActive: boolean }) {
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
            les interrupteurs sous la légende ; le ressenti reste toujours visible. L’anxiété est
            saisie de 0 à 10 mais tracée sur la même échelle −10…+10 que le ressenti (0 → −10, 10 →
            +10).
          </Typography>
          <Typography variant="body2" component="div" sx={{ mb: zoomActive ? 1 : 0 }}>
            Les bandes roses signalent les jours de règles : plus la bande est haute, plus le flux
            menstruel renseigné est intense (cinq niveaux possibles). La couleur ne change pas :
            seule la hauteur traduit l’intensité.
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
      placement="top"
      enterTouchDelay={0}
      leaveTouchDelay={4000}
      slotProps={{ tooltip: { sx: { maxWidth: 320 } } }}
    >
      <IconButton
        size="small"
        color="inherit"
        aria-label="Aide sur la lecture du graphe"
        sx={{ color: 'text.secondary', p: 0.25 }}
      >
        <HelpOutlineIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  );
}

function formatTick(value: string, isMobile: boolean): string {
  const d = dayjs(value);
  return isMobile ? d.format('DD/MM') : d.format('D MMM');
}

function sensationValueColor(sensation: number, theme: Theme): string {
  if (sensation > 0) return theme.palette.success.main;
  if (sensation < 0) return theme.palette.error.main;
  return theme.palette.text.primary;
}

/** Détail du log dans la tooltip (valeur ressenti colorée). */
function LogTooltipBody({
  row,
  showPeriodDetails,
  showAnxiety,
}: {
  row: DailyLogView;
  showPeriodDetails: boolean;
  showAnxiety: boolean;
}) {
  const theme = useTheme();
  const scoreColor = sensationValueColor(row.sensation, theme);
  const anxietyY = anxietyLevelToChartY(row.anxietyLevel ?? 0);
  const anxietyColor = sensationValueColor(anxietyY, theme);

  return (
    <Box sx={{ display: 'block', lineHeight: 1.45, overflowWrap: 'break-word' }}>
      <Typography component="div" variant="body2">
        Ressenti :{' '}
        <Box component="span" sx={{ color: scoreColor, fontWeight: 600 }}>
          {row.sensation}
        </Box>
      </Typography>
      {showAnxiety ? (
        <>
          <Typography component="div" variant="body2">
            Anxiété (graphe, −10…+10) :{' '}
            <Box component="span" sx={{ color: anxietyColor, fontWeight: 600 }}>
              {anxietyY}
            </Box>
          </Typography>
          <Typography component="div" variant="caption" color="text.secondary" display="block">
            Saisie : {row.anxietyLevel ?? 0} / 10
          </Typography>
        </>
      ) : null}
      {showPeriodDetails && row.isPeriodDay ? (
        <>
          <Typography component="div" variant="body2">
            Jour de règles : Oui
          </Typography>
          <Typography component="div" variant="body2">
            Flux : {row.periodFlow !== null ? PERIOD_FLOW_LABELS[row.periodFlow] : 'Non renseigné'}
          </Typography>
        </>
      ) : null}
      {row.comment?.trim() ? (
        <Typography component="div" variant="body2" sx={{ whiteSpace: 'pre-line', mt: 0.25 }}>
          Commentaire : {row.comment.trim()}
        </Typography>
      ) : null}
    </Box>
  );
}

/** Tooltip axe identique au défaut MUI, avec corps enrichi (couleur ressenti + champs log). */
function SensationAxisTooltipContent({
  logs,
  showPeriodDetails,
  showAnxiety,
}: {
  logs: DailyLogView[];
  showPeriodDetails: boolean;
  showAnxiety: boolean;
}) {
  const tooltipData = useAxesTooltip();

  if (tooltipData === null) return null;

  return (
    <ChartsTooltipPaper className={chartsTooltipClasses.paper}>
      {tooltipData.map(
        ({ axisId, mainAxis, axisValue, axisFormattedValue, seriesItems, dataIndex }) => (
          <ChartsTooltipTable key={String(axisId)} className={chartsTooltipClasses.table}>
            {axisValue != null && !mainAxis.hideTooltip ? (
              <Typography component="caption" variant="caption" display="block">
                {axisFormattedValue}
              </Typography>
            ) : null}
            <tbody>
              {(() => {
                const row = logs[dataIndex];
                const hasPoint =
                  row !== undefined &&
                  seriesItems.some(({ formattedValue }) => formattedValue != null);
                if (!hasPoint) return null;
                return (
                  <ChartsTooltipRow key="daily-log-detail" className={chartsTooltipClasses.row}>
                    <ChartsTooltipCell
                      component="th"
                      className={`${chartsTooltipClasses.labelCell} ${chartsTooltipClasses.cell}`}
                      sx={{ display: 'none' }}
                    />
                    <ChartsTooltipCell
                      component="td"
                      className={`${chartsTooltipClasses.valueCell} ${chartsTooltipClasses.cell}`}
                    >
                      <LogTooltipBody
                        row={row}
                        showPeriodDetails={showPeriodDetails}
                        showAnxiety={showAnxiety}
                      />
                    </ChartsTooltipCell>
                  </ChartsTooltipRow>
                );
              })()}
            </tbody>
          </ChartsTooltipTable>
        ),
      )}
    </ChartsTooltipPaper>
  );
}

/** Bandes « jour de règles » : hauteur proportionnelle à l’intensité du flux, ancrées en bas de la zone de tracé. */
function PeriodDayBandHighlights({
  bands,
}: {
  bands: { date: string; flow: PeriodFlowLevel | null }[];
}) {
  const theme = useTheme();
  const { top, height } = useDrawingArea();
  const xScale = useXScale();

  const bandwidth =
    xScale && typeof xScale === 'function' && 'bandwidth' in xScale
      ? (xScale as { bandwidth: () => number }).bandwidth()
      : 0;

  if (!bandwidth) return null;

  return (
    <g aria-hidden pointerEvents="none">
      {bands.map(({ date: d, flow }) => {
        const bandStart = (xScale as (v: string) => number | undefined)(d);
        if (bandStart === undefined) return null;
        const barHeight = height * periodFlowHeightFraction(flow);
        const y = top + (height - barHeight);
        return (
          <rect
            key={d}
            x={bandStart}
            y={y}
            width={bandwidth}
            height={barHeight}
            fill={periodBandFill(theme)}
          />
        );
      })}
    </g>
  );
}

function useMeasuredWidth<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    if (!active) {
      setWidth(0);
      return;
    }
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      setWidth((prev) => (prev !== w ? w : prev));
    };

    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [active]);

  return { ref, width };
}

export function SensationChart({ logs, onSelectDate }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartHeight = isMobile ? 300 : 320;

  const [showPeriodBands, setShowPeriodBands] = useState(true);
  const [showAnxietySeries, setShowAnxietySeries] = useState(true);

  const periodBands = useMemo(
    () => logs.filter((l) => l.isPeriodDay).map((l) => ({ date: l.date, flow: l.periodFlow })),
    [logs],
  );

  const { ref: measureRef, width: chartWidth } = useMeasuredWidth<HTMLDivElement>(logs.length > 0);

  if (logs.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
        <Typography color="text.secondary">Aucune donnée sur cette période.</Typography>
      </Paper>
    );
  }

  const dataset = logs.map((l) => ({
    date: l.date,
    sensation: l.sensation,
    anxietyChartY: anxietyLevelToChartY(l.anxietyLevel ?? 0),
  }));

  const targetTicks = isMobile ? 5 : 8;
  const tickStep = Math.max(1, Math.ceil(logs.length / targetTicks));
  const tickInterval =
    logs.length <= 7
      ? ('auto' as const)
      : (_value: unknown, index: number) => index % tickStep === 0;

  const timelineZoomActive = logs.length >= TIMELINE_ZOOM_MIN_POINTS;

  const xAxisConfig = useMemo(
    () => ({
      scaleType: 'band' as const,
      dataKey: 'date' as const,
      tickLabelStyle: { fontSize: isMobile ? 11 : 12 },
      valueFormatter: (v: string) => formatTick(v, isMobile),
      tickInterval,
      ...(timelineZoomActive
        ? {
            zoom: {
              filterMode: 'keep' as const,
              panning: true,
              minSpan: 10,
              step: 2,
              slider: {
                enabled: true,
                preview: false,
                showTooltip: 'hover' as const,
              },
            },
          }
        : {}),
    }),
    [isMobile, tickInterval, timelineZoomActive],
  );

  /**
   * MUI réserve en plus des marges une zone « axis » (~45px par défaut à gauche pour le Y).
   * Sans largeur explicite, cette réserve est trop large pour des ticks courts (−10…10),
   * ce qui laisse trop de vide à gauche et donne l’impression que la courbe est décalée à droite.
   */
  const yAxisReservedWidth = isMobile ? 30 : 40;
  const chartMargin = isMobile
    ? { left: 4, right: 4, top: 12, bottom: 36 }
    : { left: 12, right: 12, top: 16, bottom: 32 };

  const handleSeriesItemClick = (
    _event: React.MouseEvent<SVGElement>,
    item: LineItemIdentifier,
  ) => {
    if (item.dataIndex === undefined) return;
    const row = logs[item.dataIndex];
    if (row) onSelectDate?.(row.date);
  };

  const chartTooltipSlot = useMemo(() => {
    function ChartTooltipSlot(props: ComponentProps<typeof ChartsTooltipContainer>) {
      return (
        <ChartsTooltipContainer {...props}>
          <SensationAxisTooltipContent
            logs={logs}
            showPeriodDetails={showPeriodBands}
            showAnxiety={showAnxietySeries}
          />
        </ChartsTooltipContainer>
      );
    }
    return ChartTooltipSlot;
  }, [logs, showPeriodBands, showAnxietySeries]);

  const showMarks = !isMobile || logs.length <= 14;

  return (
    <Paper
      variant="outlined"
      sx={{
        overflow: 'hidden',
        p: { xs: 1, sm: 2 },
        borderRadius: 3,
        width: '100%',
        maxWidth: '100%',
        mx: 0,
        boxSizing: 'border-box',
      }}
    >
      <Stack spacing={0} sx={{ width: '100%' }}>
        <Stack spacing={1} sx={{ px: 1 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            flexWrap="wrap"
            sx={{
              pt: { xs: 1.5, sm: 0 },
              pb: 0,
              gap: { xs: 1.5, sm: 2 },
              rowGap: 1,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box
                sx={{
                  width: 28,
                  height: 3,
                  bgcolor: 'primary.main',
                  borderRadius: 1,
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Ressenti
              </Typography>
            </Stack>
            {showPeriodBands ? (
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Box
                  sx={{
                    width: 11,
                    height: 14,
                    flexShrink: 0,
                    bgcolor: periodBandFill(theme),
                    borderRadius: 0.5,
                    border: `1px solid ${alpha(theme.palette.error.main, 0.28)}`,
                    boxSizing: 'border-box',
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Jour de règles (flux)
                </Typography>
              </Stack>
            ) : null}
            {showAnxietySeries ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box
                  sx={{
                    width: 28,
                    height: 3,
                    bgcolor: 'warning.main',
                    borderRadius: 1,
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Anxiété
                </Typography>
              </Stack>
            ) : null}
            <ChartLegendHelpTooltip zoomActive={timelineZoomActive} />
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            flexWrap="wrap"
            sx={{ gap: { xs: 0.5, sm: 1 }, columnGap: 2 }}
          >
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showPeriodBands}
                  onChange={(_, c) => setShowPeriodBands(c)}
                  inputProps={{ 'aria-label': 'Afficher les jours de règles sur le graphe' }}
                />
              }
              label={
                <Typography variant="caption" color="text.secondary">
                  Règles
                </Typography>
              }
              sx={{ mr: 0, ml: 0 }}
            />
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showAnxietySeries}
                  onChange={(_, c) => setShowAnxietySeries(c)}
                  inputProps={{ 'aria-label': 'Afficher la courbe d’anxiété' }}
                />
              }
              label={
                <Typography variant="caption" color="text.secondary">
                  Anxiété
                </Typography>
              }
              sx={{ mr: 0, ml: 0 }}
            />
          </Stack>
        </Stack>

        {timelineZoomActive ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ px: 1, textAlign: 'center', display: 'block', lineHeight: 1.35 }}
          >
            Pince pour zoomer, glisse pour parcourir la période. Le curseur sous le graphe permet
            aussi de te déplacer dans le temps.
          </Typography>
        ) : null}

        <Box
          ref={measureRef}
          sx={{
            width: '100%',
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'center',
            lineHeight: 0,
          }}
        >
          {chartWidth > 0 ? (
            <LineInteractionContext.Provider value={{ logs, onSelectDate }}>
              <LineChart
                hideLegend
                dataset={dataset}
                width={chartWidth}
                height={chartHeight}
                margin={chartMargin}
                onMarkClick={handleSeriesItemClick}
                xAxis={[xAxisConfig]}
                yAxis={[
                  {
                    min: -10,
                    max: 10,
                    domainLimit: 'strict',
                    width: yAxisReservedWidth,
                    tickLabelStyle: {
                      fontSize: isMobile ? 11 : 12,
                      textAnchor: 'end',
                    },
                  },
                ]}
                slots={{ tooltip: chartTooltipSlot, line: WideHitAnimatedLine }}
                series={[
                  {
                    dataKey: 'sensation',
                    label: '',
                    showMark: showMarks,
                    color: theme.palette.primary.main,
                  },
                  ...(showAnxietySeries
                    ? [
                        {
                          dataKey: 'anxietyChartY' as const,
                          label: '',
                          showMark: showMarks,
                          color: theme.palette.warning.main,
                        },
                      ]
                    : []),
                ]}
                slotProps={{
                  tooltip: {
                    sx: {
                      /** Popper : pas pleine largeur écran, marges latérales ~16px via calc */
                      maxWidth: 'min(320px, calc(100vw - 32px))',
                      [`& .${chartsTooltipClasses.paper}`]: {
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                      },
                      [`& .${chartsTooltipClasses.table}`]: { display: 'block' },
                      [`& .${chartsTooltipClasses.row}`]: { display: 'block' },
                      [`& .${chartsTooltipClasses.labelCell}`]: { display: 'none' },
                      [`& .${chartsTooltipClasses.valueCell}`]: {
                        display: 'block',
                        whiteSpace: 'pre-line',
                        lineHeight: 1.45,
                        overflowWrap: 'break-word',
                      },
                    },
                  },
                }}
                sx={{
                  display: 'block',
                  mx: 'auto',
                  maxWidth: '100%',
                  /** Défaut MUI : `pan-y` sur le svg ; sur tactile le pinch / pan du zoom est plus fiable avec `none`. */
                  ...(timelineZoomActive ? { touchAction: 'none' as const } : {}),
                }}
              >
                {showPeriodBands ? <PeriodDayBandHighlights bands={periodBands} /> : null}
                <ChartsReferenceLine
                  y={0}
                  lineStyle={{
                    stroke: theme.palette.text.secondary,
                    strokeDasharray: '4 4',
                    opacity: 0.6,
                  }}
                />
              </LineChart>
            </LineInteractionContext.Provider>
          ) : (
            <Box sx={{ height: chartHeight }} />
          )}
        </Box>
      </Stack>
    </Paper>
  );
}
