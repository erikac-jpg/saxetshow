import { createAgreement } from './repositories/agreements';
import { createEvent, getAllEvents } from './repositories/events';
import { createTableRequest } from './repositories/tableRequests';
import { createVendor } from './repositories/vendors';
import { joinWaitlist } from './repositories/waitlist';
import type { SQLDatabase } from './SQLDatabase';

const SAMPLE_EVENTS = [
  {
    name: 'McAllen Gun Show',
    date: '2026-09-19',
    location: 'McAllen Convention Center, McAllen, TX',
    description: 'Sep 19 & 20, 2026',
    totalTables: 40,
  },
  {
    name: 'Corpus Christi Gun Show',
    date: '2026-10-17',
    location: 'Richard M. Borchard Fairgrounds, Corpus Christi, TX',
    description: 'Oct 17 & 18, 2026',
    totalTables: 60,
  },
  {
    name: 'McAllen Gun Show',
    date: '2026-10-24',
    location: 'McAllen Convention Center, McAllen, TX',
    description: 'Oct 24 & 25, 2026',
    totalTables: 40,
  },
  {
    name: 'Corpus Christi Gun Show',
    date: '2026-11-21',
    location: 'Richard M. Borchard Fairgrounds, Corpus Christi, TX',
    description: 'Nov 21 & 22, 2026',
    totalTables: 60,
  },
  {
    name: 'Corpus Christi Gun Show',
    date: '2026-12-12',
    location: 'Richard M. Borchard Fairgrounds, Corpus Christi, TX',
    description: 'Dec 12 & 13, 2026',
    totalTables: 60,
  },
];

/**
 * Inserts a few sample shows (and, for the soonest one, some sample
 * vendors/requests/waitlist entries so the Staff Dashboard has something to
 * show) on first launch, only if the events table is empty.
 */
export async function seedInitialEvents(db: SQLDatabase): Promise<void> {
  const existing = await getAllEvents(db);
  if (existing.length > 0) {
    return;
  }

  const createdEvents = [];
  for (const event of SAMPLE_EVENTS) {
    createdEvents.push(await createEvent(db, event));
  }

  const soonestEvent = createdEvents[0];

  const loneStar = await createVendor(db, { businessName: 'Lone Star Firearms' });
  const borderAmmo = await createVendor(db, { businessName: 'Border Ammo Co.' });
  const texasTactical = await createVendor(db, { businessName: 'Texas Tactical Gear' });
  const rioGrande = await createVendor(db, { businessName: 'Rio Grande Reloading' });
  const frontierKnives = await createVendor(db, { businessName: 'Frontier Knives' });

  await createTableRequest(db, {
    vendorId: loneStar.id,
    eventId: soonestEvent.id,
    tablesWanted: 3,
    status: 'approved',
  });
  await createAgreement(db, {
    vendorId: loneStar.id,
    eventId: soonestEvent.id,
    status: 'signed',
  });

  await createTableRequest(db, {
    vendorId: borderAmmo.id,
    eventId: soonestEvent.id,
    tablesWanted: 2,
    status: 'pending',
  });

  await createTableRequest(db, {
    vendorId: texasTactical.id,
    eventId: soonestEvent.id,
    tablesWanted: 1,
    status: 'denied',
  });

  await createTableRequest(db, {
    vendorId: rioGrande.id,
    eventId: soonestEvent.id,
    tablesWanted: 2,
    status: 'pending',
  });

  await joinWaitlist(db, {
    vendorId: frontierKnives.id,
    eventId: soonestEvent.id,
    tablesWanted: 2,
  });
}
