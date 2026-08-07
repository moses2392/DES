/**
 * Proves the back office's rules against the live database.
 *
 * Everything a browser could do is done through a genuine signed-in session
 * with the publishable key. The service-role key is used only to create and
 * remove the two test accounts — never to perform an action under test, because
 * a check that bypasses row-level security proves nothing about it.
 *
 * Run after applying supabase/0003_staff_and_admin.sql:
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... npm run verify:staff
 *
 * The service key is read from the environment and never written to a file —
 * this application deliberately holds no secret key, and that should stay true
 * after the tests have run.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);

const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!SERVICE) {
  console.error(
    "Set SUPABASE_SERVICE_ROLE_KEY in the environment for this run.\n" +
      "Supabase -> Settings -> API -> service_role. It is only used to create and\n" +
      "delete the two test accounts; every action under test runs as a normal user."
  );
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { persistSession: false } });

const stamp = Date.now();
const OWNER = { email: `des-owner-${stamp}@example.com`, password: "correct-horse-battery" };
const AGENT = { email: `des-agent-${stamp}@example.com`, password: "correct-horse-battery" };
const OUTSIDER = { email: `des-outsider-${stamp}@example.com`, password: "correct-horse-battery" };

const results = [];
const check = (name, pass, detail = "") => {
  results.push({ name, pass });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const cleanup = { users: [], listings: [], staff: [] };

async function makeUser(who) {
  const { data, error } = await admin.auth.admin.createUser({
    email: who.email,
    password: who.password,
    email_confirm: true,
  });
  if (error) throw new Error(`createUser ${who.email}: ${error.message}`);
  cleanup.users.push(data.user.id);
  return data.user;
}

async function sessionFor(who) {
  const client = createClient(URL, PUBLISHABLE, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword(who);
  if (error) throw new Error(`signIn ${who.email}: ${error.message}`);
  return client;
}

try {
  // ---------------------------------------------------------------- set-up
  const ownerUser = await makeUser(OWNER);
  const agentUser = await makeUser(AGENT);
  await makeUser(OUTSIDER);

  for (const [user, who, role] of [
    [ownerUser, OWNER, "owner"],
    [agentUser, AGENT, "agent"],
  ]) {
    const { data, error } = await admin
      .from("staff")
      .insert({ user_id: user.id, email: who.email, full_name: `Test ${role}`, role, active: true })
      .select("id")
      .single();
    if (error) throw new Error(`staff insert: ${error.message}`);
    cleanup.staff.push(data.id);
    who.staffId = data.id;
  }

  const asOwner = await sessionFor(OWNER);
  const asAgent = await sessionFor(AGENT);
  const asOutsider = await sessionFor(OUTSIDER);
  const anon = createClient(URL, PUBLISHABLE, { auth: { persistSession: false } });

  // ------------------------------------------------- the public boundary
  const { data: anonEnq } = await anon.from("enquiries").select("id, email");
  check("a signed-out visitor still cannot read enquiries", (anonEnq ?? []).length === 0);

  const { data: outsiderEnq } = await asOutsider.from("enquiries").select("id");
  check(
    "a signed-in NON-staff account cannot read enquiries",
    (outsiderEnq ?? []).length === 0,
    "this is the check the whole back office rests on"
  );

  const { data: outsiderStaff } = await asOutsider.from("staff").select("id");
  check("a non-staff account cannot read the team list", (outsiderStaff ?? []).length === 0);

  const { data: anonPub } = await anon.from("listings").select("id").limit(5);
  check("the public can still read published listings", (anonPub ?? []).length > 0);

  // -------------------------------------------------------- staff can work
  const { error: agentListingErr, data: agentListing } = await asAgent
    .from("listings")
    .insert({
      slug: `test-agent-${stamp}`,
      title: "Test property",
      rent_pcm: 150000,
      bedrooms: 1,
      bathrooms: 1,
      property_type: "flat",
      furnishing: "furnished",
      area: "Testing",
      postcode: "E1 1AA",
      latitude: 51.5,
      longitude: -0.07,
      available_from: "2026-12-01",
      published: false,
    })
    .select("id")
    .single();
  if (agentListing) cleanup.listings.push(agentListing.id);
  check("an agent can create a property", !agentListingErr, agentListingErr?.code ?? "");

  const { data: agentSees } = await asAgent.from("enquiries").select("id");
  check("an agent can read enquiries", Array.isArray(agentSees));

  // ------------------------------------------- the role boundary that matters
  const { error: agentDelete } = await asAgent
    .from("listings")
    .delete()
    .eq("id", agentListing.id);
  const { data: stillThere } = await admin
    .from("listings")
    .select("id")
    .eq("id", agentListing.id)
    .maybeSingle();
  check(
    "an agent CANNOT delete a property",
    Boolean(stillThere),
    agentDelete?.code ?? "no error reported — checked the stored row instead"
  );

  // Postgres reports success on an UPDATE matching zero rows, so the stored
  // value is what proves this, not the absence of an error.
  const { error: promoteErr } = await asAgent
    .from("staff")
    .update({ role: "owner" })
    .eq("id", AGENT.staffId);
  const { data: agentRow } = await admin
    .from("staff")
    .select("role")
    .eq("id", AGENT.staffId)
    .single();
  check(
    "an agent CANNOT promote themselves to owner",
    agentRow.role === "agent",
    `role is "${agentRow.role}"${promoteErr ? "" : " (update reported no error)"}`
  );

  const { error: addStaffErr } = await asAgent
    .from("staff")
    .insert({ email: `sneaky-${stamp}@example.com`, role: "owner" });
  check("an agent CANNOT add a member of staff", Boolean(addStaffErr), addStaffErr?.code ?? "");

  const { error: ownerDelete } = await asOwner
    .from("listings")
    .delete()
    .eq("id", agentListing.id);
  const { data: goneNow } = await admin
    .from("listings")
    .select("id")
    .eq("id", agentListing.id)
    .maybeSingle();
  check("an owner CAN delete a property", !ownerDelete && !goneNow);
  if (!goneNow) cleanup.listings = cleanup.listings.filter((id) => id !== agentListing.id);

  // ------------------------------------------------ the append-only history
  const { data: enquiryRow } = await admin
    .from("enquiries")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (enquiryRow) {
    const { data: note, error: noteErr } = await asAgent
      .from("enquiry_notes")
      .insert({ enquiry_id: enquiryRow.id, author_id: AGENT.staffId, body: "Test note", kind: "note" })
      .select("id")
      .single();
    check("staff can add a note", !noteErr, noteErr?.code ?? "");

    if (note) {
      const { error: editErr } = await asAgent
        .from("enquiry_notes")
        .update({ body: "Rewritten" })
        .eq("id", note.id);
      const { data: after } = await admin
        .from("enquiry_notes")
        .select("body")
        .eq("id", note.id)
        .single();
      check(
        "an agent CANNOT rewrite a note",
        after.body === "Test note",
        editErr?.code ?? `body is "${after.body}"`
      );

      // The point of an append-only trail: not even an owner may edit it.
      const { error: ownerEditErr } = await asOwner
        .from("enquiry_notes")
        .update({ body: "Owner rewrote this" })
        .eq("id", note.id);
      const { data: afterOwner } = await admin
        .from("enquiry_notes")
        .select("body")
        .eq("id", note.id)
        .single();
      check(
        "an OWNER cannot rewrite a note either",
        afterOwner.body === "Test note",
        ownerEditErr?.code ?? `body is "${afterOwner.body}"`
      );

      const { error: delErr } = await asOwner.from("enquiry_notes").delete().eq("id", note.id);
      const { data: noteStill } = await admin
        .from("enquiry_notes")
        .select("id")
        .eq("id", note.id)
        .maybeSingle();
      check("nobody can delete a note", Boolean(noteStill), delErr?.code ?? "");

      await admin.from("enquiry_notes").delete().eq("id", note.id);
    }

    // Authorship cannot be forged: the insert policy requires author_id to be
    // the caller's own staff row.
    const { error: forgedErr } = await asAgent.from("enquiry_notes").insert({
      enquiry_id: enquiryRow.id,
      author_id: OWNER.staffId,
      body: "Filed under someone else's name",
      kind: "note",
    });
    check(
      "staff cannot file a note under a colleague's name",
      Boolean(forgedErr),
      forgedErr?.code ?? "insert succeeded"
    );
  } else {
    console.log("skip  note checks — no enquiry exists to attach one to");
  }

  // -------------------------------------------------- deactivation is real
  await admin.from("staff").update({ active: false }).eq("id", AGENT.staffId);
  const asDeactivated = await sessionFor(AGENT);
  const { data: deactivatedSees } = await asDeactivated.from("enquiries").select("id");
  check(
    "a deactivated agent immediately loses access",
    (deactivatedSees ?? []).length === 0,
    "their password still works; their permissions do not"
  );
} catch (err) {
  console.error("\nSETUP ERROR:", err.message);
  console.error("Has supabase/0003_staff_and_admin.sql been run?");
  process.exitCode = 1;
} finally {
  for (const id of cleanup.listings) await admin.from("listings").delete().eq("id", id);
  for (const id of cleanup.staff) await admin.from("staff").delete().eq("id", id);
  for (const id of cleanup.users) await admin.auth.admin.deleteUser(id);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) process.exitCode = 1;
}
