import { createInMemoryDatabase } from '../src/db/testing/createInMemoryDatabase';
import * as agreements from '../src/db/repositories/agreements';
import * as events from '../src/db/repositories/events';
import * as tableRequests from '../src/db/repositories/tableRequests';
import * as tables from '../src/db/repositories/tables';
import * as users from '../src/db/repositories/users';
import * as vendors from '../src/db/repositories/vendors';
import * as waitlist from '../src/db/repositories/waitlist';
import type { SQLDatabase } from '../src/db/SQLDatabase';

describe('data layer', () => {
  let db: SQLDatabase;

  beforeEach(async () => {
    db = await createInMemoryDatabase();
  });

  test('creates and reads a user', async () => {
    const user = await users.createUser(db, {
      name: 'Erika Cureton',
      email: 'erika@example.com',
      role: 'staff',
      phone: '555-0100',
    });
    expect(user.id).toBeGreaterThan(0);

    const fetched = await users.getUserById(db, user.id);
    expect(fetched).toEqual(user);

    const byEmail = await users.getUserByEmail(db, 'erika@example.com');
    expect(byEmail?.id).toBe(user.id);
  });

  test('rejects a duplicate user email and an invalid role', async () => {
    await users.createUser(db, { name: 'A', email: 'dupe@example.com', role: 'member' });
    await expect(
      users.createUser(db, { name: 'B', email: 'dupe@example.com', role: 'member' })
    ).rejects.toThrow();

    await expect(
      // @ts-expect-error deliberately invalid role to prove the CHECK constraint holds
      users.createUser(db, { name: 'C', email: 'c@example.com', role: 'admin' })
    ).rejects.toThrow();
  });

  test('creates a vendor linked to a user and updates it', async () => {
    const user = await users.createUser(db, {
      name: 'Vendor Owner',
      email: 'vendor@example.com',
      role: 'vendor',
    });
    const vendor = await vendors.createVendor(db, {
      userId: user.id,
      businessName: 'Iron Sights LLC',
      productsTheyBring: 'Ammo, holsters',
      feesOwed: 50,
    });
    expect(vendor.userId).toBe(user.id);
    expect(vendor.feesOwed).toBe(50);

    const updated = await vendors.updateVendor(db, vendor.id, { feesOwed: 0, boothNotes: 'Paid in full' });
    expect(updated?.feesOwed).toBe(0);
    expect(updated?.boothNotes).toBe('Paid in full');
    expect(updated?.businessName).toBe('Iron Sights LLC');

    const byUser = await vendors.getVendorByUserId(db, user.id);
    expect(byUser?.id).toBe(vendor.id);
  });

  test('creates an event and filters by visibility', async () => {
    const visibleEvent = await events.createEvent(db, {
      name: 'Spring Gun Show',
      date: '2026-03-15',
      location: 'Fairgrounds Hall A',
      visible: true,
    });
    await events.createEvent(db, {
      name: 'Draft Planning Event',
      date: '2026-04-01',
      visible: false,
    });

    const all = await events.getAllEvents(db);
    expect(all).toHaveLength(2);

    const visible = await events.getVisibleEvents(db);
    expect(visible).toHaveLength(1);
    expect(visible[0].id).toBe(visibleEvent.id);
  });

  test('total_tables defaults to 0 and can be updated on an event', async () => {
    const event = await events.createEvent(db, { name: 'Venue Test Show', date: '2026-06-01' });
    expect(event.totalTables).toBe(0);

    const created = await events.createEvent(db, {
      name: 'Preset Venue Show',
      date: '2026-06-02',
      totalTables: 40,
    });
    expect(created.totalTables).toBe(40);

    const updated = await events.updateEvent(db, event.id, { totalTables: 25 });
    expect(updated?.totalTables).toBe(25);
  });

  test('getUpcomingEvents excludes past and hidden events, soonest first', async () => {
    const past = await events.createEvent(db, { name: 'Last Year Show', date: '2020-01-01' });
    const soon = await events.createEvent(db, { name: 'Soon Show', date: '2099-02-01' });
    const later = await events.createEvent(db, { name: 'Later Show', date: '2099-03-01' });
    const hidden = await events.createEvent(db, {
      name: 'Draft Show',
      date: '2099-01-15',
      visible: false,
    });

    const upcoming = await events.getUpcomingEvents(db, '2099-01-01');
    expect(upcoming.map((e) => e.id)).toEqual([soon.id, later.id]);
    expect(upcoming.map((e) => e.id)).not.toContain(past.id);
    expect(upcoming.map((e) => e.id)).not.toContain(hidden.id);
  });

  async function createVendorAndEvent() {
    const vendor = await vendors.createVendor(db, { businessName: 'Test Vendor' });
    const event = await events.createEvent(db, { name: 'Test Event', date: '2026-05-01' });
    return { vendor, event };
  }

  test('table request lifecycle: pending -> approved', async () => {
    const { vendor, event } = await createVendorAndEvent();
    const request = await tableRequests.createTableRequest(db, {
      vendorId: vendor.id,
      eventId: event.id,
      tablesWanted: 2,
    });
    expect(request.status).toBe('pending');

    const approved = await tableRequests.updateTableRequestStatus(db, request.id, 'approved');
    expect(approved?.status).toBe('approved');

    const forEvent = await tableRequests.getTableRequestsForEvent(db, event.id);
    expect(forEvent).toHaveLength(1);
  });

  test('assigns a vendor to a table and marks it paid, enforcing unique table numbers per event', async () => {
    const { vendor, event } = await createVendorAndEvent();
    const table = await tables.createEventTable(db, { eventId: event.id, tableNumber: 1 });
    expect(table.vendorId).toBeNull();
    expect(table.paid).toBe(false);

    const assigned = await tables.assignVendorToTable(db, table.id, vendor.id);
    expect(assigned?.vendorId).toBe(vendor.id);

    const paid = await tables.setTablePaid(db, table.id, true);
    expect(paid?.paid).toBe(true);

    await expect(
      tables.createEventTable(db, { eventId: event.id, tableNumber: 1 })
    ).rejects.toThrow();

    const vendorTables = await tables.getTablesForVendor(db, vendor.id);
    expect(vendorTables).toHaveLength(1);
  });

  test('agreement status progresses from not_sent to signed', async () => {
    const { vendor, event } = await createVendorAndEvent();
    const agreement = await agreements.createAgreement(db, { vendorId: vendor.id, eventId: event.id });
    expect(agreement.status).toBe('not_sent');

    await agreements.updateAgreementStatus(db, agreement.id, 'sent');
    const signed = await agreements.updateAgreementStatus(db, agreement.id, 'signed');
    expect(signed?.status).toBe('signed');

    const found = await agreements.getAgreementForVendorAndEvent(db, vendor.id, event.id);
    expect(found?.id).toBe(agreement.id);
  });

  test('waitlist assigns increasing positions and closes gaps on removal', async () => {
    const { event } = await createVendorAndEvent();
    const vendorA = await vendors.createVendor(db, { businessName: 'Vendor A' });
    const vendorB = await vendors.createVendor(db, { businessName: 'Vendor B' });
    const vendorC = await vendors.createVendor(db, { businessName: 'Vendor C' });

    const entryA = await waitlist.joinWaitlist(db, { vendorId: vendorA.id, eventId: event.id, tablesWanted: 1 });
    const entryB = await waitlist.joinWaitlist(db, { vendorId: vendorB.id, eventId: event.id, tablesWanted: 1 });
    const entryC = await waitlist.joinWaitlist(db, { vendorId: vendorC.id, eventId: event.id, tablesWanted: 2 });

    expect([entryA.position, entryB.position, entryC.position]).toEqual([1, 2, 3]);

    await waitlist.removeFromWaitlist(db, entryA.id);

    const remaining = await waitlist.getWaitlistForEvent(db, event.id);
    expect(remaining.map((e) => [e.vendorId, e.position])).toEqual([
      [vendorB.id, 1],
      [vendorC.id, 2],
    ]);
  });

  test('deleting an event cascades to its table requests, tables, agreements, and waitlist entries', async () => {
    const { vendor, event } = await createVendorAndEvent();
    await tableRequests.createTableRequest(db, { vendorId: vendor.id, eventId: event.id, tablesWanted: 1 });
    await tables.createEventTable(db, { eventId: event.id, tableNumber: 1 });
    await agreements.createAgreement(db, { vendorId: vendor.id, eventId: event.id });
    await waitlist.joinWaitlist(db, { vendorId: vendor.id, eventId: event.id, tablesWanted: 1 });

    await events.deleteEvent(db, event.id);

    expect(await tableRequests.getTableRequestsForEvent(db, event.id)).toHaveLength(0);
    expect(await tables.getTablesForEvent(db, event.id)).toHaveLength(0);
    expect(await agreements.getAgreementsForEvent(db, event.id)).toHaveLength(0);
    expect(await waitlist.getWaitlistForEvent(db, event.id)).toHaveLength(0);
  });
});
