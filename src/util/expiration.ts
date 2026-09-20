/** Days until `dateString`; negative means already past. Null if unparseable/empty. */
export function daysUntil(dateString: string): number | null {
  if (!dateString) return null;
  const target = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function expirationWarning(label: string, dateString: string): string | null {
  const days = daysUntil(dateString);
  if (days === null) return null;
  if (days < 0) return `⚠ ${label} expired`;
  if (days <= 60) return `⚠ ${label} expires in ${days} days`;
  return null;
}
