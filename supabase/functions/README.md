# Edge Functions

## notify-staff-pending-request

Sends an email to staff whenever a vendor submits a new table request.

### What's needed before this does anything

1. **Working SMTP credentials.** Same Gmail-account-plus-App-Password setup
   described for Authentication's SMTP Settings - this function needs its
   own copy of those same four values, since Edge Function secrets are a
   separate store from Authentication's SMTP config, even if you end up
   reusing the exact same Gmail account for both.

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
   | `SMTP_HOST` | `smtp.gmail.com` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | the sending Gmail address |
   | `SMTP_PASSWORD` | the Gmail App Password |
   | `STAFF_NOTIFY_EMAIL` | `saxetshowsaxet@gmail.com` (optional - this is already the default if left unset) |

4. **Wire up the trigger** (Database → Webhooks → Create a new webhook):
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
