import { createEvent, getAllEvents } from './repositories/events';
import type { SQLDatabase } from './SQLDatabase';

const SAMPLE_EVENTS = [
  {
    name: 'McAllen Gun Show',
    date: '2026-09-19',
    location: 'McAllen Convention Center, McAllen, TX',
    description: 'Sep 19 & 20, 2026',
  },
  {
    name: 'Corpus Christi Gun Show',
    date: '2026-10-17',
    location: 'Richard M. Borchard Fairgrounds, Corpus Christi, TX',
    description: 'Oct 17 & 18, 2026',
  },
  {
    name: 'McAllen Gun Show',
    date: '2026-10-24',
    location: 'McAllen Convention Center, McAllen, TX',
    description: 'Oct 24 & 25, 2026',
  },
  {
    name: 'Corpus Christi Gun Show',
    date: '2026-11-21',
    location: 'Richard M. Borchard Fairgrounds, Corpus Christi, TX',
    description: 'Nov 21 & 22, 2026',
  },
  {
    name: 'Corpus Christi Gun Show',
    date: '2026-12-12',
    location: 'Richard M. Borchard Fairgrounds, Corpus Christi, TX',
    description: 'Dec 12 & 13, 2026',
  },
];

/** Inserts a few sample shows on first launch, only if the events table is empty. */
export async function seedInitialEvents(db: SQLDatabase): Promise<void> {
  const existing = await getAllEvents(db);
  if (existing.length > 0) {
    return;
  }
  for (const event of SAMPLE_EVENTS) {
    await createEvent(db, event);
  }
}
