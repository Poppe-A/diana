import type { SaveDailyLogPayload } from './api';
import type { DailyLogView, PeriodFlowLevel } from './types';

export type DailyLogDraft = {
  sensation: number;
  anxietyLevel: number;
  sleepQuality: number;
  comment: string;
  isPeriodDay: boolean;
  periodFlow: '' | PeriodFlowLevel;
};

export const EMPTY_DAILY_LOG_DRAFT: DailyLogDraft = {
  sensation: 5,
  anxietyLevel: 0,
  sleepQuality: 0,
  comment: '',
  isPeriodDay: false,
  periodFlow: '',
};

export function draftFromLog(log: DailyLogView | null | undefined): DailyLogDraft {
  if (!log) return { ...EMPTY_DAILY_LOG_DRAFT };
  return {
    sensation: log.sensation,
    anxietyLevel: log.anxietyLevel ?? 0,
    sleepQuality: log.sleepQuality ?? 0,
    comment: log.comment ?? '',
    isPeriodDay: log.isPeriodDay,
    periodFlow: log.periodFlow ?? '',
  };
}

export function draftToSavePayload(draft: DailyLogDraft): SaveDailyLogPayload {
  return {
    sensation: draft.sensation,
    anxietyLevel: draft.anxietyLevel,
    sleepQuality: draft.sleepQuality,
    comment: draft.comment || undefined,
    isPeriodDay: draft.isPeriodDay,
    ...(draft.isPeriodDay && draft.periodFlow ? { periodFlow: draft.periodFlow } : {}),
  };
}

const WIZARD_SAVE_STEPS = ['sensation', 'anxiety', 'sleep', 'period', 'comment'] as const;
export type WizardSaveStep = (typeof WIZARD_SAVE_STEPS)[number];

/** N’envoie sleepQuality qu’à partir de l’étape sommeil (compatible API sans ce champ). */
export function draftToWizardSavePayload(
  completedStep: WizardSaveStep,
  draft: DailyLogDraft,
): SaveDailyLogPayload {
  const payload: SaveDailyLogPayload = {
    sensation: draft.sensation,
    anxietyLevel: completedStep === 'sensation' ? 0 : draft.anxietyLevel,
    isPeriodDay:
      completedStep === 'period' || completedStep === 'comment' ? draft.isPeriodDay : false,
  };

  if (completedStep === 'period' || completedStep === 'comment') {
    if (draft.isPeriodDay && draft.periodFlow) payload.periodFlow = draft.periodFlow;
  }

  if (completedStep === 'comment' && draft.comment) {
    payload.comment = draft.comment;
  }

  if (completedStep === 'sleep' || completedStep === 'period' || completedStep === 'comment') {
    payload.sleepQuality = draft.sleepQuality;
  }

  return payload;
}
