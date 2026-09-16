export function nowIso(): string {
  return new Date().toISOString();
}

export function toBool(value: number): boolean {
  return value === 1;
}

export function fromBool(value: boolean): number {
  return value ? 1 : 0;
}
