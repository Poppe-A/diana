import type { DailyLogView } from '../types';

/** Journal réellement renseigné (hors valeurs par défaut d’une sauvegarde partielle). */
export function isSubstantiveDailyLog(log: DailyLogView | null): boolean {
  if (!log) return false;
  return (
    log.sensation !== 5 ||
    log.anxietyLevel !== 0 ||
    log.sleepQuality !== 0 ||
    log.isPeriodDay ||
    Boolean(log.comment?.trim())
  );
}
