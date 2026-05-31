const storageKey = (date: string) => `diana:dailyLog:onboardingDone:${date}`;

export function isTodayOnboardingDone(date: string): boolean {
  return sessionStorage.getItem(storageKey(date)) === '1';
}

export function markTodayOnboardingDone(date: string): void {
  sessionStorage.setItem(storageKey(date), '1');
}
