import { createInMemoryDatabase } from '../src/db/testing/createInMemoryDatabase';
import { createEvent, getAllEvents } from '../src/db/repositories/events';
import { getTableRequestsForEvent } from '../src/db/repositories/tableRequests';
import { getAllVendors } from '../src/db/repositories/vendors';
import { getWaitlistForEvent } from '../src/db/repositories/waitlist';
import { seedInitialEvents } from '../src/db/seed';
import type { SQLDatabase } from '../src/db/SQLDatabase';

describe('seedInitialEvents', () => {
  let db: SQLDatabase;

  beforeEach(async () => {
    db = await createInMemoryDatabase();
  });

  test('inserts sample events into an empty database', async () => {
    await seedInitialEvents(db);
    const events = await getAllEvents(db);
    expect(events.length).toBeGreaterThan(0);
  });

  test('does nothing if events already exist', async () => {
    await createEvent(db, { name: 'Existing Show', date: '2026-01-01' });
    await seedInitialEvents(db);
    const events = await getAllEvents(db);
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe('Existing Show');
  });

  test('seeds demo vendors, table requests, and a waitlist entry for the soonest event', async () => {
    await seedInitialEvents(db);
    const [soonestEvent] = await getAllEvents(db);

    const vendors = await getAllVendors(db);
    expect(vendors.length).toBeGreaterThanOrEqual(5);

    const requests = await getTableRequestsForEvent(db, soonestEvent.id);
    expect(requests.some((r) => r.status === 'approved')).toBe(true);
    expect(requests.some((r) => r.status === 'pending')).toBe(true);
    expect(requests.some((r) => r.status === 'denied')).toBe(true);

    const waitlist = await getWaitlistForEvent(db, soonestEvent.id);
    expect(waitlist).toHaveLength(1);
    expect(waitlist[0].position).toBe(1);
  });
});
