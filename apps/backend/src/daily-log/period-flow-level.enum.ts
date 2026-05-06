/** Intensité du flux menstruel (1 = très faible … 5 = très important). */
export enum PeriodFlowLevel {
  VeryLight = 1,
  Light = 2,
  Medium = 3,
  Heavy = 4,
  VeryHeavy = 5,
}

const LEVEL_NUMBERS = new Set<number>(
  Object.values(PeriodFlowLevel).filter((v): v is PeriodFlowLevel => typeof v === 'number'),
);

export function isPeriodFlowLevel(value: number): value is PeriodFlowLevel {
  return Number.isInteger(value) && LEVEL_NUMBERS.has(value);
}

/** Libellés UI (français) — à utiliser côté appli pour l’affichage. */
export const PERIOD_FLOW_LABELS: Record<PeriodFlowLevel, string> = {
  [PeriodFlowLevel.VeryLight]: 'Très faible',
  [PeriodFlowLevel.Light]: 'Faible',
  [PeriodFlowLevel.Medium]: 'Moyen',
  [PeriodFlowLevel.Heavy]: 'Important',
  [PeriodFlowLevel.VeryHeavy]: 'Très important',
};
