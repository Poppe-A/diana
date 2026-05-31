export const EVENT_COLORS = ['red', 'blue', 'green', 'yellow', 'purple'] as const;

export type EventColor = (typeof EVENT_COLORS)[number];

export const DEFAULT_EVENT_COLOR: EventColor = 'blue';

export const EVENT_COLOR_OPTIONS: { value: EventColor; label: string; hex: string }[] = [
  { value: 'red', label: 'Rouge', hex: '#dc2626' },
  { value: 'blue', label: 'Bleu', hex: '#2563eb' },
  { value: 'green', label: 'Vert', hex: '#16a34a' },
  { value: 'yellow', label: 'Jaune', hex: '#ca8a04' },
  { value: 'purple', label: 'Violet', hex: '#7c3aed' },
];

export function eventColorHex(color: EventColor): string {
  return EVENT_COLOR_OPTIONS.find((o) => o.value === color)?.hex ?? EVENT_COLOR_OPTIONS[1].hex;
}

export function eventBandFill(hex: string, mode: 'light' | 'dark'): string {
  const opacity = mode === 'dark' ? 0.42 : 0.32;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
