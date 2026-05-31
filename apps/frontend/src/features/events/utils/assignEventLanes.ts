export type EventWithLane<T extends { id: number; startDate: string; endDate: string }> = T & {
  lane: number;
};

/** Empile les événements qui se chevauchent sur des « lignes » distinctes. */
export function assignEventLanes<T extends { id: number; startDate: string; endDate: string }>(
  events: T[],
): EventWithLane<T>[] {
  const sorted = [...events].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.id - b.id,
  );
  const laneEnds: string[] = [];

  return sorted.map((event) => {
    let lane = laneEnds.findIndex((end) => end < event.startDate);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(event.endDate);
    } else {
      laneEnds[lane] = event.endDate;
    }
    return { ...event, lane };
  });
}
