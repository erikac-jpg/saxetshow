# Edge Functions

## notify-staff-pending-request

Sends an email to staff whenever a vendor submits a new table request.

### What's needed before this does anything

This sends through **Resend's HTTP API**, not SMTP - direct SMTP from
Supabase's Edge Function runtime to Gmail was tried first and fails with
`BadResource: Bad resource ID at Object.startTls`, a runtime-level
limitation (the STARTTLS socket upgrade a direct SMTP connection needs
doesn't work there), not a config mistake. An HTTPS POST has no such
problem, hence Resend instead of the Gmail SMTP credentials used for
Authentication's own emails.

1. **A Resend account and API key.** Sign up at resend.com, then API Keys
   → Create API Key. Without a verified domain (see step 4), Resend's
   free tier only delivers to the email address the account itself was
   created with - sign up using `saffshowsaxet@gmail.com` (or whichever
   address should receive the notification, e.g. `saxetshowsaxet@gmail.com`)
   as the account's own login, not a different one, or test sends will
   get rejected.

2. **Deploy the function.** From a machine with the Supabase CLI logged in
   and this project linked:

   ```
   supabase functions deploy notify-staff-pending-request
   ```

   (No CLI access yet? The dashboard's Edge Functions page also has a
   "Create a new function" flow where you can paste this file's contents
   directly - no CLI required, just slower to iterate on.)

3. **Set the function's secrets** (Project Settings → Edge Functions →
   Secrets - NOT the same page as Authentication's SMTP Settings):

   | Secret | Example |
   |---|---|
   | `RESEND_API_KEY` | the key from step 1 |
   | `STAFF_NOTIFY_EMAIL` | `saxetshowsaxet@gmail.com` (optional - this is already the default if left unset; must match the Resend account's own email until a domain is verified) |

4. **(Optional, later)** Once a real domain is verified with Resend
   (Domains → Add Domain), update `FROM_ADDRESS` in `index.ts` to send
   from an address on that domain instead of Resend's shared
   `onboarding@resend.dev`, and redeploy - at that point the recipient
   restriction from step 1 also goes away.

5. **Wire up the trigger** (Database → Webhooks → Create a new webhook):
   - Table: `table_requests`
   - Events: `Insert` only
   - Type: `HTTP Request`
   - URL: this function's URL (shown on its dashboard page after deploy)
   - Headers: add `Authorization: Bearer <service_role key>` so the
     webhook's call is authenticated the same way everything else backend-side is.

Once all four of those are in place, every new table request (vendors can
only ever create one in `pending` status - see the RLS policy in
`supabase/migrations/0004_rls.sql`) sends one email.

### Testing it

Easiest path: create a test table request from a test vendor account in
the app, then check the Edge Function's logs (dashboard → Edge Functions
→ notify-staff-pending-request → Logs) to confirm it ran and see any
error, plus confirm the email actually landed in the `STAFF_NOTIFY_EMAIL`
inbox.
