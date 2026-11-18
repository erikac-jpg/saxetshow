// Lets staff manually email every vendor who's ever attended a show,
// reminding them about an upcoming one. Staff taps a button on the
// Staff Dashboard (picking which upcoming event to promote); this
// function does the rest.
//
// Unlike notify-staff-pending-request, this one is called directly by
// the app (supabase.functions.invoke), not by a Database Webhook - so
// it has to check for itself that the caller is actually staff, since
// nothing else is gating who can trigger it.
//
// Sends via Resend's HTTP API, same as notify-staff-pending-request -
// see that function's comments for why (Supabase's Edge Function
// runtime can't do raw SMTP STARTTLS).
//
// Secrets this function needs (Project Settings -> Edge Functions ->
// Secrets) - same RESEND_API_KEY as notify-staff-pending-request,
// nothing new to add:
//   RESEND_API_KEY
//
// IMPORTANT: until a real domain is verified with Resend (Domains ->
// Add Domain), Resend's free tier only delivers to the email address
// the Resend account itself was created with - every vendor's own
// email will get silently rejected until that's done. See
// supabase/functions/README.md.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

// Resend's own shared sending domain - swap for an address on the
// client's real domain once it's verified with Resend (see above).
const FROM_ADDRESS = 'Saxet Gun Show <onboarding@resend.dev>';

interface RequestBody {
  eventId: number;
}

interface VendorRow {
  vendor_id: number;
  vendors: {
    email: string | null;
    contact_name: string | null;
    business_name: string | null;
  } | null;
}

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Missing Authorization header', { status: 401 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }
  if (!body.eventId) {
    return new Response('eventId is required', { status: 400 });
  }

  // A client scoped to the caller's own JWT, not the service role - RLS
  // decides what it can see, which is exactly how we confirm they're
  // staff: the `users_select_own` policy only returns their own row.
  const callerClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: callerProfile, error: callerError } = await callerClient
    .from('users')
    .select('role')
    .maybeSingle();
  if (callerError || callerProfile?.role !== 'staff') {
    return new Response('Staff access required', { status: 403 });
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: event, error: eventError } = await admin
    .from('events')
    .select('name, date, location')
    .eq('id', body.eventId)
    .maybeSingle();
  if (eventError || !event) {
    return new Response('Event not found', { status: 404 });
  }

  const { data: attendedRows, error: attendedError } = await admin
    .from('table_requests')
    .select('vendor_id, vendors(email, contact_name, business_name)')
    .not('checked_in_at', 'is', null);
  if (attendedError) {
    console.error('Failed to load past attendees:', attendedError);
    return new Response('Failed to load past attendees', { status: 500 });
  }

  // One email per vendor, even if they've attended multiple past shows.
  const vendorsById = new Map<number, { email: string; name: string }>();
  for (const row of (attendedRows ?? []) as VendorRow[]) {
    const email = row.vendors?.email;
    if (!email || vendorsById.has(row.vendor_id)) continue;
    const name = row.vendors?.business_name ?? row.vendors?.contact_name ?? 'there';
    vendorsById.set(row.vendor_id, { email, name });
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.error('RESEND_API_KEY is not configured; skipping email send.');
    return new Response('Resend API key not configured', { status: 500 });
  }

  const dateLabel = event.date
    ? new Date(`${event.date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  let sent = 0;
  const failures: string[] = [];

  for (const vendor of vendorsById.values()) {
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: vendor.email,
        subject: `${event.name} is coming up`,
        html: `
          <p>Hi ${vendor.name},</p>
          <p><strong>${event.name}</strong> is coming up${dateLabel ? ` on ${dateLabel}` : ''}${
            event.location ? ` at ${event.location}` : ''
          }.</p>
          <p>Open the Saxet Gun Show app to request your table for this show.</p>
        `,
      }),
    });

    if (emailResponse.ok) {
      sent += 1;
    } else {
      const errorBody = await emailResponse.text();
      console.error('Resend error for', vendor.email, emailResponse.status, errorBody);
      failures.push(vendor.email);
    }

    // A light pause between sends to stay well under Resend's rate limit
    // rather than firing the whole list at once.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return new Response(
    JSON.stringify({ totalVendors: vendorsById.size, sent, failed: failures }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
