export type Season = 'deer' | 'turkey' | 'hog' | 'duck';

export const SEASON_LABEL: Record<Season, string> = {
  deer: 'deer season',
  turkey: 'spring turkey season',
  hog: 'hog season',
  duck: 'duck season',
};

/** Texas hunting-season mascot for the given date's month: Nov-Jan deer, Feb-May turkey, Jun-Aug hog, Sep-Oct duck. */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth();
  if (month === 10 || month === 11 || month === 0) return 'deer';
  if (month >= 1 && month <= 4) return 'turkey';
  if (month >= 5 && month <= 7) return 'hog';
  return 'duck';
}
