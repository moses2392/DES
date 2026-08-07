# The staff back office

Everything at `/admin`: properties, enquiries, and who can sign in.

Written for someone setting this up for the first time. Three steps, about ten
minutes, and two of them happen in Supabase rather than in the app.

---

## What it does

**Properties** — add, edit, publish and unpublish. Photographs upload straight
from the browser. The location is set by clicking a map rather than typing
coordinates, because typing them is how a flat ends up in the Atlantic.

**Enquiries** — every message from the website, moving through *New →
Contacted → Viewing booked → Closed*. Each one can be assigned to a person and
carries a history of notes. Booking a viewing asks for the date and puts it in
the diary on the overview page.

**Team** — owners can add staff and deactivate people who leave. Agents cannot;
the tab is not even shown to them.

### Two roles

| | Agent | Owner |
|---|---|---|
| See and edit properties | ✓ | ✓ |
| Publish and unpublish | ✓ | ✓ |
| Work enquiries, add notes | ✓ | ✓ |
| **Delete** a property | ✗ | ✓ |
| **Delete** an enquiry | ✗ | ✓ |
| Add or deactivate staff | ✗ | ✓ |

Deleting a property also deletes every enquiry about it, which is why it is an
owner's job and sits behind typing the property's name to confirm. Agents
unpublish instead — the property leaves the website and keeps its history.

---

## Setting it up

### 1. Run the migration

Open Supabase → **SQL Editor** → **New query**, paste the whole of
`supabase/0003_staff_and_admin.sql`, and run it. It is safe to run more than
once.

That creates the `staff` and `enquiry_notes` tables, the photo storage bucket,
and the security rules that decide who may do what.

### 2. Create the first login

There is a chicken and egg: only an owner can add staff, and there is no owner
yet. So the first one is made by hand.

1. Supabase → **Authentication** → **Users** → **Add user**.
2. Use Moses's real email, set a password, and tick **Auto Confirm User**.
3. Back in the SQL Editor, run the statement at the bottom of
   `0003_staff_and_admin.sql` — the commented-out one — with that same email.

### 3. Sign in

Go to `/admin/sign-in`. From here everyone else is added from inside the app.

### Adding somebody later

Two halves, both needed:

1. **In the app** — Team → Add someone. This decides their role.
2. **In Supabase** — Authentication → Users → Add user, with the *same* email.

They join the moment they first sign in; until then the team list shows *"Has
not signed in yet"*. Adding only the app half means they have no password;
adding only the Supabase half means they can sign in but see *"No access to the
back office"*.

> This is the one clumsy part, and it is deliberate. Creating passwords from
> inside the app would require putting Supabase's secret key into this
> application — see below for why that has been avoided.

---

## Why there is still no secret key

The public site was built so that every credential in it is safe to expose:
listings are readable by anyone, enquiries can be written by anyone and read by
nobody, and the enforcement is in the database rather than the code.

Adding a back office did not change that. Staff powers come from **being signed
in**, not from a privileged key. Every admin rule asks a question about who you
are:

```sql
create policy "enquiries_staff_read" on public.enquiries
  for select to authenticated using (public.is_staff());
```

The same key that sits in a visitor's browser cannot read a single enquiry,
because that browser has no staff session. Photograph uploads work the same way
— straight from the browser to storage, authorised by a rule that checks
`is_staff()`.

The practical consequence: a mistake in the application code cannot leak data.
Forgetting a filter in a query returns *fewer* rows, never somebody else's.

### Notes cannot be edited

`enquiry_notes` has an INSERT policy and a SELECT policy, and no UPDATE or
DELETE policy at all — not for agents, not for owners. A pipeline whose history
can be rewritten afterwards cannot settle an argument about who promised what.
Status changes are written into the same trail, so the history reads as one
sequence.

---

## If something looks wrong

**"No access to the back office"** — the account exists but is not on the staff
list, or has been deactivated. Also what you see before step 1 has been run.

**Photographs will not upload** — check the migration ran; it creates the
`listing-photos` bucket. An upload refused with a policy error means the account
is not staff.

**An uploaded photo shows "No photograph"** — `next/image` refuses hosts that
are not in its allowlist. Both the allowlist and `next.config.ts` derive the
Supabase host from `NEXT_PUBLIC_SUPABASE_URL`, so this means that variable is
missing or points somewhere else.

**A property will not save with "Another property already uses that web
address"** — two properties produced the same slug. Renaming slightly is enough;
new properties get a suffix automatically, edits do not.
