export enum EventColor {
  Red = 'red',
  Blue = 'blue',
  Green = 'green',
  Yellow = 'yellow',
  Purple = 'purple',
}

export const EVENT_COLOR_VALUES: EventColor[] = [
  EventColor.Red,
  EventColor.Blue,
  EventColor.Green,
  EventColor.Yellow,
  EventColor.Purple,
];

export function isEventColor(value: string): value is EventColor {
  return (EVENT_COLOR_VALUES as string[]).includes(value);
}

export const DEFAULT_EVENT_COLOR = EventColor.Blue;
