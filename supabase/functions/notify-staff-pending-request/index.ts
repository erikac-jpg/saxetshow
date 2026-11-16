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
// Sends via Resend's HTTP API rather than raw SMTP - Supabase's Edge
// Function runtime can't do the STARTTLS socket upgrade a direct SMTP
// connection to Gmail needs (confirmed by testing: it fails with
// "BadResource: Bad resource ID at Object.startTls" on every attempt,
// a runtime-level limitation, not a config mistake). An HTTPS POST has
// no such problem.
//
// Secrets this function needs (Project Settings -> Edge Functions ->
// Secrets):
//   RESEND_API_KEY       from resend.com -> API Keys
//   STAFF_NOTIFY_EMAIL   where the notification goes (defaults below if unset)
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are already provided
// automatically inside every Edge Function - not something to add by hand.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const DEFAULT_STAFF_EMAIL = 'saxetshowsaxet@gmail.com';
// Resend's own shared sending domain - works immediately with no setup,
// since it's already verified on Resend's end. Switch this to an address
// on the client's own domain later, once/if that domain is verified
// with Resend (Domains -> Add Domain).
const FROM_ADDRESS = 'Saxet Gun Show <onboarding@resend.dev>';

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

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const staffEmail = Deno.env.get('STAFF_NOTIFY_EMAIL') ?? DEFAULT_STAFF_EMAIL;

  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured; skipping email send.');
    return new Response('Resend API key not configured', { status: 500 });
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: staffEmail,
      subject: `New table request: ${vendorName}`,
      html: `
        <p><strong>${vendorName}</strong> requested ${request.tables_wanted} ${tableWord}
        for <strong>${eventName}</strong>${eventDate ? ` on ${eventDate}` : ''}.</p>
        <p>Open the Staff Dashboard in the app to approve or deny it.</p>
      `,
    }),
  });

  if (!emailResponse.ok) {
    const errorBody = await emailResponse.text();
    console.error('Resend API error:', emailResponse.status, errorBody);
    return new Response(`Resend error: ${errorBody}`, { status: 502 });
  }

  return new Response('Sent', { status: 200 });
});
