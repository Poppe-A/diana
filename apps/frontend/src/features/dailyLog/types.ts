/** Intensité du flux menstruel (1 = très faible … 5 = très important). */
export enum PeriodFlowLevel {
  VeryLight = 1,
  Light = 2,
  Medium = 3,
  Heavy = 4,
  VeryHeavy = 5,
}

export const PERIOD_FLOW_ORDER: PeriodFlowLevel[] = [
  PeriodFlowLevel.VeryLight,
  PeriodFlowLevel.Light,
  PeriodFlowLevel.Medium,
  PeriodFlowLevel.Heavy,
  PeriodFlowLevel.VeryHeavy,
];

export const PERIOD_FLOW_LABELS: Record<PeriodFlowLevel, string> = {
  [PeriodFlowLevel.VeryLight]: 'Très faible',
  [PeriodFlowLevel.Light]: 'Faible',
  [PeriodFlowLevel.Medium]: 'Moyen',
  [PeriodFlowLevel.Heavy]: 'Important',
  [PeriodFlowLevel.VeryHeavy]: 'Très important',
};

export type DailyLogView = {
  id: number;
  date: string;
  sensation: number;
  comment: string | null;
  isPeriodDay: boolean;
  periodFlow: PeriodFlowLevel | null;
  /** 0 = aucune … 10 = très forte */
  anxietyLevel: number;
  /** 0 = très mauvais … 10 = excellent */
  sleepQuality: number;
};

/** Entrée calendaire renvoyée par GET /daily-logs (plage dense, un jour = une ligne). */
export type DailyLogHistoryDay = {
  date: string;
  filled: boolean;
  log: DailyLogView | null;
};

/** 0 = très mauvais, 5 = neutre, 10 = excellent */
export const SENSATION_MIN = 0;
export const SENSATION_MAX = 10;
export const SENSATION_NEUTRAL = 5;

export const ANXIETY_MIN = 0;
export const ANXIETY_MAX = 10;

export const SLEEP_QUALITY_MIN = 0;
export const SLEEP_QUALITY_MAX = 10;
