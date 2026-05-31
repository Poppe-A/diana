import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  IconButton,
  Slider,
  Stack,
  Switch,
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
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ComponentProps } from 'react';
import type { LineItemIdentifier } from '@mui/x-charts/models';
import {
  PERIOD_FLOW_LABELS,
  type DailyLogHistoryDay,
  type PeriodFlowLevel,
} from '../../dailyLog/types';
import { useHistoryChartDisplay } from '../hooks/useHistoryChartDisplay';
import type { RangeKey } from '../hooks/useHistoryLogs';
import {
  computeHistoryViewportStats,
  computeVisibleDayIndices,
  isFullTimelineVisible,
  type HistoryViewportStats,
} from '../utils/historyViewportStats';
import { CHART_HELP_ZOOM_MIN_POINTS } from './HistoryChartHelpButton';

type Props = {
  days: DailyLogHistoryDay[];
  range: RangeKey;
  onSelectDate?: (date: string) => void;
  /** Stats recalculées pour les jours visibles (zoom + défilement). `null` = toute la période. */
  onViewportStatsChange?: (stats: HistoryViewportStats | null) => void;
};

/** Anxiété saisie sur 0…10, même axe vertical que le ressenti : 0 → −10, 10 → +10 (linéaire). */
function anxietyLevelToChartY(anxiety01To10: number): number {
  const x = Math.min(10, Math.max(0, anxiety01To10));
  return -10 + (x / 10) * 20;
}

/** Sommeil saisie sur 0…10, même axe vertical que le ressenti. */
function sleepQualityToChartY(sleep0To10: number): number {
  const x = Math.min(10, Math.max(0, sleep0To10));
  return -10 + (x / 10) * 20;
}

const SLEEP_CHART_COLOR = '#5b21b6';
/** Vert foncé pour la courbe ressenti (distinct du primary mauve de l’app). */
const SENSATION_CHART_COLOR = '#15803d';
/** Ambre clair pour l’anxiété (moins soutenu que warning.main). */
const ANXIETY_CHART_COLOR = '#fbbf24';

/** Épaisseur invisible de la zone cliquable autour de la courbe (SVG stroke). */
const LINE_HIT_STROKE_PX = 18;

const MAX_PX_PER_DAY = 22;
const PX_PER_DAY_STEP = 1;
const SLIDER_STEP = 0.25;
/** Lissage uniquement vue entièrement dézoomée (curseur « Détail » au minimum). */
const QUARTER_SMOOTH_WINDOW = 5;
const YEAR_SMOOTH_WINDOW = 14;
/** Au-delà de ce zoom relatif, pas de lissage (données brutes). */
const SMOOTH_MAX_ZOOM_PROGRESS = 0.01;

type OverviewSmoothConfig = {
  window: number;
  flatThreshold: number;
  peakResidualScale: number;
  minPeakDelta: number;
};

function clampPxPerDay(value: number, minPxPerDay: number): number {
  return Math.min(MAX_PX_PER_DAY, Math.max(minPxPerDay, value));
}

function getOverviewSmoothConfig(
  range: RangeKey,
  pxPerDay: number,
  sliderMinPxPerDay: number,
  daysLength: number,
): OverviewSmoothConfig | null {
  if (daysLength === 0) return null;

  const zoomSpan = MAX_PX_PER_DAY - sliderMinPxPerDay;
  const zoomProgress = zoomSpan <= 0.01 ? 0 : (pxPerDay - sliderMinPxPerDay) / zoomSpan;
  if (zoomProgress > SMOOTH_MAX_ZOOM_PROGRESS) return null;

  if (range === '1y') {
    return {
      window: YEAR_SMOOTH_WINDOW,
      flatThreshold: 1.2,
      peakResidualScale: 9,
      minPeakDelta: 3,
    };
  }

  if (range === '3m') {
    return {
      window: QUARTER_SMOOTH_WINDOW,
      flatThreshold: 1,
      peakResidualScale: 7.5,
      minPeakDelta: 2.8,
    };
  }

  return null;
}

function isStrictLocalExtremum(
  values: (number | null)[],
  index: number,
  halfWindow: number,
): boolean {
  const value = values[index];
  if (value === null) return false;
  let isMin = true;
  let isMax = true;
  for (
    let j = Math.max(0, index - halfWindow);
    j <= Math.min(values.length - 1, index + halfWindow);
    j++
  ) {
    if (j === index) continue;
    const neighbor = values[j];
    if (neighbor === null) continue;
    if (neighbor < value) isMax = false;
    if (neighbor > value) isMin = false;
  }
  return isMin || isMax;
}

/** Moyenne glissante sur les jours renseignés ; les jours vides restent null. */
function smoothNullableSeries(values: (number | null)[], windowSize: number): (number | null)[] {
  if (windowSize <= 1) return values;
  return values.map((_value, index) => {
    if (values[index] === null) return null;
    const half = Math.floor(windowSize / 2);
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, index - half); j <= Math.min(values.length - 1, index + half); j++) {
      const neighbor = values[j];
      if (neighbor !== null) {
        sum += neighbor;
        count += 1;
      }
    }
    return count > 0 ? sum / count : null;
  });
}

/**
 * Lissage marqué sur les zones plates ; restitution progressive (puis complète)
 * des écarts réellement significatifs — sans lisser les vrais pics.
 */
function smoothNullableSeriesWithPeaks(
  values: (number | null)[],
  windowSize: number,
  flatThreshold: number,
  peakResidualScale: number,
  minPeakDelta: number,
): (number | null)[] {
  const average = smoothNullableSeries(values, windowSize);
  const half = Math.floor(windowSize / 2);
  const peakSpan = Math.max(peakResidualScale - flatThreshold, 0.5);

  return values.map((original, index) => {
    if (original === null || average[index] === null) return average[index];
    const avg = average[index]!;
    const residual = original - avg;
    const absResidual = Math.abs(residual);

    if (absResidual <= flatThreshold) {
      return avg;
    }

    const linearWeight = Math.min(1, (absResidual - flatThreshold) / peakSpan);
    let blend = linearWeight * linearWeight;

    if (absResidual >= minPeakDelta && isStrictLocalExtremum(values, index, half)) {
      const extremumBoost = 0.85 + 0.15 * Math.min(1, absResidual / peakResidualScale);
      blend = Math.max(blend, extremumBoost);
    }

    return avg + residual * blend;
  });
}

function applyOverviewSmooth(
  values: (number | null)[],
  config: OverviewSmoothConfig,
): (number | null)[] {
  return smoothNullableSeriesWithPeaks(
    values,
    config.window,
    config.flatThreshold,
    config.peakResidualScale,
    config.minPeakDelta,
  );
}

function touchDistance(a: Touch, b: Touch): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

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
  days: DailyLogHistoryDay[];
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
      if (!ctx?.onSelectDate || ctx.days.length === 0) return;
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
      if (dataIndex < 0 || dataIndex >= ctx.days.length) return;

      ctx.onSelectDate(ctx.days[dataIndex].date);
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

function formatTick(value: string, isMobile: boolean, showMonth: boolean): string {
  const d = dayjs(value);
  if (isMobile && !showMonth) return d.format('DD/MM');
  return d.format('D MMM');
}

function parseColorChannel(color: string): [number, number, number] | null {
  const normalized = color.trim();
  if (normalized.startsWith('#')) {
    const h = normalized.slice(1);
    if (h.length !== 6) return null;
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgbMatch = normalized.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!rgbMatch) return null;
  return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
}

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

/** `towardRed` 0 = vert, 1 = rouge. */
function gradientRedGreen(towardRed: number, theme: Theme): string {
  const t = Math.min(1, Math.max(0, towardRed));
  const green = parseColorChannel(theme.palette.success.main);
  const red = parseColorChannel(theme.palette.error.main);
  if (!green || !red) {
    return t >= 0.5 ? theme.palette.error.main : theme.palette.success.main;
  }
  return `rgb(${lerpChannel(green[0], red[0], t)}, ${lerpChannel(green[1], red[1], t)}, ${lerpChannel(green[2], red[2], t)})`;
}

/** −10 → rouge, +10 → vert, 0 → intermédiaire. */
function sensationValueColor(sensation: number, theme: Theme): string {
  const clamped = Math.min(10, Math.max(-10, sensation));
  const towardRed = 1 - (clamped + 10) / 20;
  return gradientRedGreen(towardRed, theme);
}

/** 0 → vert, 10 → rouge (anxiété). `invert` : 0 → rouge, 10 → vert (sommeil). */
function scale0To10Color(value: number, theme: Theme, invert: boolean): string {
  const t = Math.min(10, Math.max(0, value)) / 10;
  const towardRed = invert ? 1 - t : t;
  return gradientRedGreen(towardRed, theme);
}

/** Détail du log dans la tooltip (valeur ressenti colorée). */
function LogTooltipBody({
  day,
  showPeriodDetails,
  showAnxiety,
  showSleep,
}: {
  day: DailyLogHistoryDay;
  showPeriodDetails: boolean;
  showAnxiety: boolean;
  showSleep: boolean;
}) {
  const theme = useTheme();

  if (!day.filled || !day.log) {
    return (
      <Typography variant="body2" color="text.secondary">
        Ce jour n’a pas été renseigné.
      </Typography>
    );
  }

  const row = day.log;
  const anxietyLevel = row.anxietyLevel ?? 0;
  const sleepQuality = row.sleepQuality ?? 0;
  const scoreColor = sensationValueColor(row.sensation, theme);
  const anxietyColor = scale0To10Color(anxietyLevel, theme, false);
  const sleepColor = scale0To10Color(sleepQuality, theme, true);

  return (
    <Box sx={{ display: 'block', lineHeight: 1.45, overflowWrap: 'break-word' }}>
      <Typography component="div" variant="body2">
        Ressenti :{' '}
        <Box component="span" sx={{ color: scoreColor, fontWeight: 600 }}>
          {row.sensation}
        </Box>
      </Typography>
      {showAnxiety ? (
        <Typography component="div" variant="body2">
          Anxiété :{' '}
          <Box component="span" sx={{ color: anxietyColor, fontWeight: 600 }}>
            {anxietyLevel} / 10
          </Box>
        </Typography>
      ) : null}
      {showSleep ? (
        <Typography component="div" variant="body2">
          Sommeil :{' '}
          <Box component="span" sx={{ color: sleepColor, fontWeight: 600 }}>
            {sleepQuality} / 10
          </Box>
        </Typography>
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
  days,
  showPeriodDetails,
  showAnxiety,
  showSleep,
}: {
  days: DailyLogHistoryDay[];
  showPeriodDetails: boolean;
  showAnxiety: boolean;
  showSleep: boolean;
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
                const day = days[dataIndex];
                if (!day) return null;
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
                        day={day}
                        showPeriodDetails={showPeriodDetails}
                        showAnxiety={showAnxiety}
                        showSleep={showSleep}
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

/** Zones cliquables invisibles sur les jours sans saisie (pas de point sur la courbe). */
function DayColumnHitTargets({
  dates,
  onSelectDate,
}: {
  dates: string[];
  onSelectDate?: (date: string) => void;
}) {
  const { top, height } = useDrawingArea();
  const xScale = useXScale();

  const bandwidth =
    xScale && typeof xScale === 'function' && 'bandwidth' in xScale
      ? (xScale as { bandwidth: () => number }).bandwidth()
      : 0;

  if (!bandwidth || !onSelectDate) return null;

  return (
    <g aria-label="Jours non renseignés">
      {dates.map((d) => {
        const bandStart = (xScale as (v: string) => number | undefined)(d);
        if (bandStart === undefined) return null;
        return (
          <rect
            key={d}
            x={bandStart}
            y={top}
            width={bandwidth}
            height={height}
            fill="transparent"
            pointerEvents="all"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectDate(d)}
          />
        );
      })}
    </g>
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

export function SensationChart({ days, range, onSelectDate, onViewportStatsChange }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const chartHeight = isMobile ? 300 : 320;
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    showPeriodBands,
    showAnxietySeries,
    showSleepSeries,
    setShowPeriodBands,
    setShowAnxietySeries,
    setShowSleepSeries,
  } = useHistoryChartDisplay();

  /** Zoom volontairement en mémoire session uniquement (jamais localStorage). */
  const [pxPerDayOverride, setPxPerDayOverride] = useState<number | null>(null);
  const pendingScrollToStartRef = useRef(true);

  useEffect(() => {
    setPxPerDayOverride(null);
  }, [range]);

  useEffect(() => {
    pendingScrollToStartRef.current = true;
  }, [range, days.length]);

  const periodBands = useMemo(
    () =>
      days
        .filter((d) => d.filled && d.log?.isPeriodDay)
        .map((d) => ({ date: d.date, flow: d.log!.periodFlow })),
    [days],
  );

  const unfilledDates = useMemo(() => days.filter((d) => !d.filled).map((d) => d.date), [days]);

  const { ref: measureRef, width: chartWidth } = useMeasuredWidth<HTMLDivElement>(days.length > 0);

  const fitPxPerDay = useMemo(() => {
    if (days.length === 0 || chartWidth <= 0) return MAX_PX_PER_DAY;
    return chartWidth / days.length;
  }, [chartWidth, days.length]);

  /** Minimum du curseur = toute la période visible d’un coup (origine à gauche). */
  const sliderMinPxPerDay = Math.min(fitPxPerDay, MAX_PX_PER_DAY);
  const defaultPxPerDay = sliderMinPxPerDay;
  const zoomSliderActive =
    days.length >= CHART_HELP_ZOOM_MIN_POINTS && sliderMinPxPerDay < MAX_PX_PER_DAY - 0.01;

  const timelineScrollActive = days.length >= CHART_HELP_ZOOM_MIN_POINTS;
  const pxPerDay = pxPerDayOverride ?? defaultPxPerDay;
  const plotWidth = timelineScrollActive
    ? Math.max(chartWidth, Math.ceil(days.length * pxPerDay))
    : chartWidth;
  const isHorizontallyScrollable = timelineScrollActive && plotWidth > chartWidth + 1;
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const syncScroll = () => setScrollLeft(el.scrollLeft);
    syncScroll();
    el.addEventListener('scroll', syncScroll, { passive: true });
    return () => el.removeEventListener('scroll', syncScroll);
  }, [plotWidth, chartWidth, isHorizontallyScrollable]);

  useEffect(() => {
    if (!onViewportStatsChange) return;
    if (days.length === 0 || chartWidth <= 0) {
      onViewportStatsChange(null);
      return;
    }
    const el = scrollRef.current;
    const viewportWidth = el?.clientWidth ?? chartWidth;
    const currentScrollLeft = el?.scrollLeft ?? scrollLeft;
    if (
      isFullTimelineVisible(currentScrollLeft, viewportWidth, plotWidth, isHorizontallyScrollable)
    ) {
      onViewportStatsChange(null);
      return;
    }
    const { startIndex, endIndex } = computeVisibleDayIndices(
      days.length,
      currentScrollLeft,
      viewportWidth,
      pxPerDay,
    );
    if (endIndex < startIndex) {
      onViewportStatsChange(null);
      return;
    }
    onViewportStatsChange(computeHistoryViewportStats(days, startIndex, endIndex));
  }, [
    chartWidth,
    days,
    isHorizontallyScrollable,
    onViewportStatsChange,
    plotWidth,
    pxPerDay,
    scrollLeft,
  ]);

  useEffect(() => {
    onViewportStatsChange?.(null);
  }, [days.length, onViewportStatsChange, range]);

  const chartWidthRef = useRef(chartWidth);
  const daysLengthRef = useRef(days.length);
  const pxPerDayRef = useRef(pxPerDay);
  const sliderMinRef = useRef(sliderMinPxPerDay);
  const zoomSliderActiveRef = useRef(zoomSliderActive);

  useEffect(() => {
    chartWidthRef.current = chartWidth;
    daysLengthRef.current = days.length;
    pxPerDayRef.current = pxPerDay;
    sliderMinRef.current = sliderMinPxPerDay;
    zoomSliderActiveRef.current = zoomSliderActive;
  }, [chartWidth, days.length, pxPerDay, sliderMinPxPerDay, zoomSliderActive]);

  const scrollToStartIfPending = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !pendingScrollToStartRef.current) return;
    el.scrollLeft = 0;
    pendingScrollToStartRef.current = false;
    setScrollLeft(0);
  }, []);

  useLayoutEffect(() => {
    scrollToStartIfPending();
    const el = scrollRef.current;
    if (!el) return;
    const inner = el.firstElementChild;
    if (!inner || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => scrollToStartIfPending());
    ro.observe(inner);
    return () => ro.disconnect();
  }, [days.length, range, plotWidth, scrollToStartIfPending]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !timelineScrollActive) return;

    const computePlotWidth = (px: number) =>
      Math.max(chartWidthRef.current, Math.ceil(daysLengthRef.current * px));

    let mode: 'none' | 'pan' | 'pinch' = 'none';
    let panStartX = 0;
    let panStartY = 0;
    let panStartScrollLeft = 0;
    let pinchStartDistance = 0;
    let pinchStartPxPerDay = 0;
    let pinchContentX = 0;

    const applyPinchZoom = (nextPxRaw: number, focalClientX: number) => {
      if (!zoomSliderActiveRef.current) return;
      const nextPx = clampPxPerDay(nextPxRaw, sliderMinRef.current);
      const oldPlot = computePlotWidth(pinchStartPxPerDay);
      const newPlot = computePlotWidth(nextPx);
      const rect = el.getBoundingClientRect();
      const focalOffset = focalClientX - rect.left;

      setPxPerDayOverride(nextPx);
      pxPerDayRef.current = nextPx;

      if (oldPlot <= 0) return;
      const maxScroll = Math.max(0, newPlot - el.clientWidth);
      el.scrollLeft = Math.max(
        0,
        Math.min(maxScroll, pinchContentX * (newPlot / oldPlot) - focalOffset),
      );
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2 && zoomSliderActiveRef.current) {
        mode = 'pinch';
        const t0 = event.touches[0];
        const t1 = event.touches[1];
        pinchStartDistance = touchDistance(t0, t1);
        if (pinchStartDistance <= 0) return;
        pinchStartPxPerDay = pxPerDayRef.current;
        const focalClientX = (t0.clientX + t1.clientX) / 2;
        const rect = el.getBoundingClientRect();
        pinchContentX = el.scrollLeft + (focalClientX - rect.left);
        return;
      }
      if (event.touches.length === 1) {
        mode = 'pan';
        panStartX = event.touches[0].clientX;
        panStartY = event.touches[0].clientY;
        panStartScrollLeft = el.scrollLeft;
      }
    };

    const onTouchMove = (event: TouchEvent) => {
      if (mode === 'pinch' && event.touches.length === 2 && zoomSliderActiveRef.current) {
        const t0 = event.touches[0];
        const t1 = event.touches[1];
        if (pinchStartDistance <= 0) return;
        const scale = touchDistance(t0, t1) / pinchStartDistance;
        const focalClientX = (t0.clientX + t1.clientX) / 2;
        applyPinchZoom(pinchStartPxPerDay * scale, focalClientX);
        event.preventDefault();
        return;
      }
      if (mode === 'pan' && event.touches.length === 1) {
        const dx = panStartX - event.touches[0].clientX;
        const dy = panStartY - event.touches[0].clientY;
        if (Math.abs(dx) <= Math.abs(dy)) return;
        el.scrollLeft = panStartScrollLeft + dx;
        event.preventDefault();
      }
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length === 0) {
        mode = 'none';
        return;
      }
      if (event.touches.length === 1 && mode === 'pinch') {
        mode = 'pan';
        panStartX = event.touches[0].clientX;
        panStartY = event.touches[0].clientY;
        panStartScrollLeft = el.scrollLeft;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [timelineScrollActive]);

  const preserveScrollRatio = useCallback(
    (apply: () => void) => {
      const el = scrollRef.current;
      if (!el || !isHorizontallyScrollable) {
        apply();
        return;
      }
      const maxScroll = el.scrollWidth - el.clientWidth;
      const ratio = maxScroll > 0 ? el.scrollLeft / maxScroll : 1;
      apply();
      requestAnimationFrame(() => {
        const next = scrollRef.current;
        if (!next) return;
        const nextMax = next.scrollWidth - next.clientWidth;
        next.scrollLeft = ratio * nextMax;
      });
    },
    [isHorizontallyScrollable],
  );

  const setPxPerDay = useCallback(
    (next: number | ((prev: number) => number)) => {
      preserveScrollRatio(() => {
        setPxPerDayOverride((prev) => {
          const current = prev ?? defaultPxPerDay;
          const resolved = typeof next === 'function' ? next(current) : next;
          return clampPxPerDay(resolved, sliderMinPxPerDay);
        });
      });
    },
    [defaultPxPerDay, preserveScrollRatio, sliderMinPxPerDay],
  );

  const approxDaysInViewport = chartWidth > 0 && pxPerDay > 0 ? chartWidth / pxPerDay : days.length;

  const overviewSmoothConfig = getOverviewSmoothConfig(
    range,
    pxPerDay,
    sliderMinPxPerDay,
    days.length,
  );
  const lineCurve =
    overviewSmoothConfig !== null && overviewSmoothConfig.window >= 7
      ? ('natural' as const)
      : ('monotoneX' as const);

  const dataset = useMemo(() => {
    const sensationRaw = days.map((d) => (d.filled && d.log ? d.log.sensation : null));
    const anxietyRaw = days.map((d) =>
      d.filled && d.log ? anxietyLevelToChartY(d.log.anxietyLevel ?? 0) : null,
    );
    const sleepRaw = days.map((d) =>
      d.filled && d.log ? sleepQualityToChartY(d.log.sleepQuality ?? 0) : null,
    );

    const smooth = (values: (number | null)[]) =>
      overviewSmoothConfig ? applyOverviewSmooth(values, overviewSmoothConfig) : values;

    const sensation = smooth(sensationRaw);
    const anxietyChartY = smooth(anxietyRaw);
    const sleepChartY = smooth(sleepRaw);

    return days.map((d, index) => ({
      date: d.date,
      sensation: sensation[index],
      anxietyChartY: anxietyChartY[index],
      sleepChartY: sleepChartY[index],
    }));
  }, [days, overviewSmoothConfig]);

  const targetTicksInViewport = isMobile ? 7 : 10;
  const minPxBetweenTicks = isMobile ? 38 : 46;
  const tickStepFromViewport = Math.max(
    1,
    Math.floor(approxDaysInViewport / targetTicksInViewport),
  );
  const tickStepFromSpacing = Math.max(1, Math.ceil(minPxBetweenTicks / pxPerDay));
  const tickStep = Math.max(1, Math.min(tickStepFromViewport, tickStepFromSpacing));
  const tickShowMonth = approxDaysInViewport <= 45 || pxPerDay > defaultPxPerDay + 0.5;
  const tickInterval =
    days.length <= 7
      ? ('auto' as const)
      : (_value: unknown, index: number) => index % tickStep === 0;

  const xAxisConfig = useMemo(
    () => ({
      scaleType: 'band' as const,
      dataKey: 'date' as const,
      tickLabelStyle: { fontSize: isMobile ? 11 : 12 },
      valueFormatter: (v: string) => formatTick(v, isMobile, tickShowMonth),
      tickInterval,
    }),
    [isMobile, tickInterval, tickShowMonth],
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

  const handleSeriesItemClick = useCallback(
    (_event: React.MouseEvent<SVGElement>, item: LineItemIdentifier) => {
      if (item.dataIndex === undefined) return;
      const day = days[item.dataIndex];
      if (day) onSelectDate?.(day.date);
    },
    [days, onSelectDate],
  );

  const chartTooltipSlot = useMemo(() => {
    function ChartTooltipSlot(props: ComponentProps<typeof ChartsTooltipContainer>) {
      return (
        <ChartsTooltipContainer {...props}>
          <SensationAxisTooltipContent
            days={days}
            showPeriodDetails={showPeriodBands}
            showAnxiety={showAnxietySeries}
            showSleep={showSleepSeries}
          />
        </ChartsTooltipContainer>
      );
    }
    return ChartTooltipSlot;
  }, [days, showPeriodBands, showAnxietySeries, showSleepSeries]);

  const legendSeriesSwatchSx = {
    width: 24,
    height: 6,
    borderRadius: 1,
  } as const;

  if (days.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ p: 4, textAlign: 'center', '&:last-child': { pb: 4 } }}>
          <Typography color="text.secondary">Aucune donnée sur cette période.</Typography>
        </CardContent>
      </Card>
    );
  }

  const lineChart = chartWidth > 0 && (
    <LineInteractionContext.Provider value={{ days, onSelectDate }}>
      <LineChart
        hideLegend
        dataset={dataset}
        width={plotWidth}
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
            showMark: false,
            color: SENSATION_CHART_COLOR,
            connectNulls: false,
            curve: lineCurve,
          },
          ...(showAnxietySeries
            ? [
                {
                  dataKey: 'anxietyChartY' as const,
                  label: '',
                  showMark: false,
                  color: ANXIETY_CHART_COLOR,
                  connectNulls: false,
                  curve: lineCurve,
                },
              ]
            : []),
          ...(showSleepSeries
            ? [
                {
                  dataKey: 'sleepChartY' as const,
                  label: '',
                  showMark: false,
                  color: SLEEP_CHART_COLOR,
                  connectNulls: false,
                  curve: lineCurve,
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
          maxWidth: 'none',
          touchAction: isHorizontallyScrollable ? 'none' : 'auto',
          '& svg': {
            touchAction: isHorizontallyScrollable ? 'none' : 'auto',
          },
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
        <DayColumnHitTargets dates={unfilledDates} onSelectDate={onSelectDate} />
      </LineChart>
    </LineInteractionContext.Provider>
  );

  return (
    <Card
      variant="outlined"
      sx={{
        overflow: 'hidden',
        p: { xs: 1, sm: 2 },
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
            justifyContent="flex-start"
            flexWrap="wrap"
            sx={{
              pt: { xs: 1.5, sm: 0 },
              pb: 0,
              gap: { xs: 1.5, sm: 2 },
              rowGap: 1,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Box sx={{ ...legendSeriesSwatchSx, bgcolor: SENSATION_CHART_COLOR }} />
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
                <Box sx={{ ...legendSeriesSwatchSx, bgcolor: ANXIETY_CHART_COLOR }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Anxiété
                </Typography>
              </Stack>
            ) : null}
            {showSleepSeries ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Box sx={{ ...legendSeriesSwatchSx, bgcolor: SLEEP_CHART_COLOR }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Sommeil
                </Typography>
              </Stack>
            ) : null}
          </Stack>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="flex-start"
            flexWrap="wrap"
            sx={{ gap: { xs: 0.5, sm: 1 }, columnGap: 2 }}
          >
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showPeriodBands}
                  onChange={(_, checked) => setShowPeriodBands(checked)}
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
                  onChange={(_, checked) => setShowAnxietySeries(checked)}
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
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showSleepSeries}
                  onChange={(_, checked) => setShowSleepSeries(checked)}
                  inputProps={{ 'aria-label': 'Afficher la courbe de sommeil' }}
                />
              }
              label={
                <Typography variant="caption" color="text.secondary">
                  Sommeil
                </Typography>
              }
              sx={{ mr: 0, ml: 0 }}
            />
          </Stack>
        </Stack>

        {zoomSliderActive ? (
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 0.5, sm: 1 }}
            sx={{ px: 1, pb: 0.5 }}
          >
            <IconButton
              size="small"
              aria-label="Moins de détail sur le graphe"
              disabled={pxPerDay <= sliderMinPxPerDay + 0.01}
              onClick={() => setPxPerDay((value) => value - PX_PER_DAY_STEP)}
            >
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                Détail
              </Typography>
              <Slider
                size="small"
                value={pxPerDay}
                min={sliderMinPxPerDay}
                max={MAX_PX_PER_DAY}
                step={SLIDER_STEP}
                aria-label="Niveau de détail du graphe"
                onChange={(_, value) => setPxPerDay(Array.isArray(value) ? value[0] : value)}
              />
            </Stack>
            <IconButton
              size="small"
              aria-label="Plus de détail sur le graphe"
              disabled={pxPerDay >= MAX_PX_PER_DAY}
              onClick={() => setPxPerDay((value) => value + PX_PER_DAY_STEP)}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Stack>
        ) : null}

        <Box
          ref={measureRef}
          sx={{
            width: '100%',
            maxWidth: '100%',
            lineHeight: 0,
          }}
        >
          <Box
            ref={scrollRef}
            sx={{
              width: '100%',
              overflowX: isHorizontallyScrollable ? 'auto' : 'hidden',
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorX: 'contain',
              touchAction: timelineScrollActive ? 'none' : 'auto',
              ...(isHorizontallyScrollable
                ? {
                    mx: -1,
                    px: 1,
                    scrollPaddingInline: 8,
                  }
                : {}),
            }}
          >
            <Box
              sx={{
                width: plotWidth,
                minWidth: '100%',
                lineHeight: 0,
              }}
            >
              {lineChart ?? <Box sx={{ height: chartHeight }} />}
            </Box>
          </Box>
        </Box>
      </Stack>
    </Card>
  );
}
