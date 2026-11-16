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

// Table pricing shown in the email's estimated total, matching the
// paper application ($93 by card, $90 cash / bank transfer). Override
// with the TABLE_PRICE_CARD / TABLE_PRICE_CASH secrets if prices change.
const DEFAULT_TABLE_PRICE_CARD = 93;
const DEFAULT_TABLE_PRICE_CASH = 90;

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
    supabase
      .from('vendors')
      .select(
        'business_name, contact_name, phone, email, website, address, products_they_bring, vendor_category, ffl_license_number, ffl_expiration_date'
      )
      .eq('id', request.vendor_id)
      .maybeSingle(),
    supabase.from('events').select('name, date, location').eq('id', request.event_id).maybeSingle(),
  ]);

  const vendorName = vendor?.business_name ?? `Vendor #${request.vendor_id}`;
  const eventName = event?.name ?? `Event #${request.event_id}`;
  const eventDate = event?.date ?? '';
  const eventLocation = event?.location ?? '';
  const tableWord = request.tables_wanted === 1 ? 'table' : 'tables';

  const priceCard = Number(Deno.env.get('TABLE_PRICE_CARD') ?? DEFAULT_TABLE_PRICE_CARD);
  const priceCash = Number(Deno.env.get('TABLE_PRICE_CASH') ?? DEFAULT_TABLE_PRICE_CASH);
  const totalCard = request.tables_wanted * priceCard;
  const totalCash = request.tables_wanted * priceCash;

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const staffEmail = Deno.env.get('STAFF_NOTIFY_EMAIL') ?? DEFAULT_STAFF_EMAIL;

  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured; skipping email send.');
    return new Response('Resend API key not configured', { status: 500 });
  }

  // Vendor-entered text goes into an HTML email, so escape it - a vendor
  // typing markup into their business name or notes shouldn't be able to
  // alter the message staff see.
  const esc = (value: string | null | undefined) =>
    (value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  const orDash = (value: string | null | undefined) => (value && value.trim() ? value.trim() : '-');

  // Deliberately NOT included: the FFL license number itself (only
  // whether one is on file and when it expires), staff notes and tags,
  // and anything payment-related. Email isn't encrypted end to end, so
  // sensitive identifiers stay in the app's staff dashboard instead.
  const fflStatus = vendor?.ffl_license_number
    ? `On file${vendor.ffl_expiration_date ? ` (expires ${vendor.ffl_expiration_date})` : ''}`
    : 'Not on file';

  const rows: Array<[string, string]> = [
    ['Name', orDash(vendor?.contact_name)],
    ['Business', vendorName],
    ['Cell phone', orDash(vendor?.phone)],
    ['Email', orDash(vendor?.email)],
    ['Address', orDash(vendor?.address)],
    ['Website', orDash(vendor?.website)],
    ['Show', `${eventName}${eventDate ? ` - ${eventDate}` : ''}${eventLocation ? ` (${eventLocation})` : ''}`],
    ['Tables requested', `${request.tables_wanted} ${tableWord}`],
    ['Category', orDash(vendor?.vendor_category)],
    ['Items for sale', orDash(vendor?.products_they_bring)],
    ['FFL license', fflStatus],
    [
      'Estimated total',
      `$${totalCard} by card ($${priceCard}/table) or $${totalCash} by cash / bank transfer ($${priceCash}/table)`,
    ],
  ];

  const html = `
    <p><strong>${esc(vendorName)}</strong> requested ${request.tables_wanted} ${tableWord}
    for <strong>${esc(eventName)}</strong>${eventDate ? ` on ${esc(eventDate)}` : ''}.</p>
    <table cellpadding="6" style="border-collapse:collapse">
      ${rows
        .map(
          ([label, value]) =>
            `<tr><td style="vertical-align:top"><strong>${esc(label)}</strong></td><td>${esc(value)}</td></tr>`
        )
        .join('')}
    </table>
    <p>Open the Staff Dashboard in the app to approve or deny it, then send the payment link.
    Replying to this email goes to the vendor.</p>
  `;
  const text =
    `${vendorName} requested ${request.tables_wanted} ${tableWord} for ${eventName}.\n\n` +
    rows.map(([label, value]) => `${label}: ${value}`).join('\n') +
    '\n\nOpen the Staff Dashboard in the app to approve or deny it, then send the payment link.';

  // Reply-To the vendor so staff can answer them straight from the email,
  // but only if what's on file actually looks like an email address.
  const vendorEmail = vendor?.email?.trim();
  const replyTo = vendorEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorEmail) ? vendorEmail : undefined;

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: staffEmail,
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: `New table request: ${vendorName} - ${request.tables_wanted} ${tableWord}, ${eventName}`,
      html,
      text,
    }),
  });

  if (!emailResponse.ok) {
    const errorBody = await emailResponse.text();
    console.error('Resend API error:', emailResponse.status, errorBody);
    return new Response(`Resend error: ${errorBody}`, { status: 502 });
  }

  return new Response('Sent', { status: 200 });
});
