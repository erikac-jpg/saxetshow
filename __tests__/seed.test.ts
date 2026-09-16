import { createInMemoryDatabase } from '../src/db/testing/createInMemoryDatabase';
import { createEvent, getAllEvents } from '../src/db/repositories/events';
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
});
