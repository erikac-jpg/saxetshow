export function nowIso(): string {
  return new Date().toISOString();
}

/** Today's calendar date as `YYYY-MM-DD`, for comparing against `Event.date`. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toBool(value: number): boolean {
  return value === 1;
}

export function fromBool(value: boolean): number {
  return value ? 1 : 0;
}
