// Emails staff when a vendor submits a new table request.
//
// Trigger: a Supabase Database Webhook on `table_requests`, INSERT only,
// pointed at this function's URL (see supabase/functions/README.md for
// the exact dashboard steps - that's a dashboard config step, not
// something this file can set up for itself).
//
// Every new request starts out `pending` (the vendor-side RLS insert
// policy enforces that), so this fires for every insert without needing
// to filter on status itself.
//
// Secrets this function needs (Project Settings -> Edge Functions ->
// Secrets, separate from Authentication's own SMTP Settings even if you
// end up reusing the same Gmail account for both):
//   SMTP_HOST      e.g. smtp.gmail.com
//   SMTP_PORT      e.g. 587
//   SMTP_USER      the sending Gmail address
//   SMTP_PASSWORD  the Gmail App Password (not the account's real password)
//   STAFF_NOTIFY_EMAIL   where the notification goes (defaults below if unset)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are already provided
// automatically inside every Edge Function - not something to add by hand.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const DEFAULT_STAFF_EMAIL = 'saxetshowsaxet@gmail.com';

interface TableRequestRow {
  id: number;
  vendor_id: number;
  event_id: number;
  tables_wanted: number;
  status: string;
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: TableRequestRow;
}

Deno.serve(async (req) => {
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (payload.type !== 'INSERT' || payload.table !== 'table_requests') {
    // Webhook is scoped to INSERT on this table already, but bail out
    // defensively rather than assume the dashboard config stays correct.
    return new Response('Ignored', { status: 200 });
  }

  const request = payload.record;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const [{ data: vendor }, { data: event }] = await Promise.all([
    supabase.from('vendors').select('business_name').eq('id', request.vendor_id).maybeSingle(),
    supabase.from('events').select('name, date').eq('id', request.event_id).maybeSingle(),
  ]);

  const vendorName = vendor?.business_name ?? `Vendor #${request.vendor_id}`;
  const eventName = event?.name ?? `Event #${request.event_id}`;
  const eventDate = event?.date ?? '';
  const tableWord = request.tables_wanted === 1 ? 'table' : 'tables';

  const smtpHost = Deno.env.get('SMTP_HOST');
  const smtpPort = Number(Deno.env.get('SMTP_PORT') ?? '587');
  const smtpUser = Deno.env.get('SMTP_USER');
  const smtpPassword = Deno.env.get('SMTP_PASSWORD');
  const staffEmail = Deno.env.get('STAFF_NOTIFY_EMAIL') ?? DEFAULT_STAFF_EMAIL;

  if (!smtpHost || !smtpUser || !smtpPassword) {
    console.error('SMTP secrets are not configured; skipping email send.');
    return new Response('SMTP not configured', { status: 500 });
  }

  const client = new SMTPClient({
    connection: {
      hostname: smtpHost,
      port: smtpPort,
      tls: true,
      auth: { username: smtpUser, password: smtpPassword },
    },
  });

  try {
    await client.send({
      from: smtpUser,
      to: staffEmail,
      subject: `New table request: ${vendorName}`,
      content: 'text/plain',
      html: `
        <p><strong>${vendorName}</strong> requested ${request.tables_wanted} ${tableWord}
        for <strong>${eventName}</strong>${eventDate ? ` on ${eventDate}` : ''}.</p>
        <p>Open the Staff Dashboard in the app to approve or deny it.</p>
      `,
    });
  } finally {
    await client.close();
  }

  return new Response('Sent', { status: 200 });
});
