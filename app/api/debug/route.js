import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG ROUTE — Visit /api/debug in your browser to diagnose connection issues.
// DELETE THIS FILE before going to production, or at least add a secret check.
// ─────────────────────────────────────────────────────────────────────────────

export async function GET() {
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `✅ Set (${process.env.NEXT_PUBLIC_SUPABASE_URL})`
        : "❌ MISSING",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? `✅ Set (starts with: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 20)}...)`
        : "❌ MISSING",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
        ? `✅ Set (starts with: ${process.env.SUPABASE_SERVICE_ROLE_KEY.slice(0, 20)}...)`
        : "❌ MISSING",
      keys_are_different:
        process.env.SUPABASE_SERVICE_ROLE_KEY !==
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? "✅ Good — service_role key is different from anon key"
          : "❌ ERROR — Both keys are identical! You need the service_role key, not the anon key.",
    },
    tests: {},
  };

  // Test 1: Can we read from guests?
  try {
    const { data, error, count } = await supabaseAdmin
      .from("guests")
      .select("id, name", { count: "exact" })
      .limit(3);

    if (error) {
      report.tests.guests = {
        status: "❌ ERROR",
        error: error.message,
        hint: error.hint,
      };
    } else {
      report.tests.guests = {
        status: "✅ SUCCESS",
        total_rows: count,
        sample: data,
      };
    }
  } catch (e) {
    report.tests.guests = { status: "❌ EXCEPTION", error: e.message };
  }

  // Test 2: Can we read from rsvps?
  try {
    const { data, error, count } = await supabaseAdmin
      .from("rsvps")
      .select("id, guest_id, attending, submitter_name", { count: "exact" })
      .limit(3);

    if (error) {
      report.tests.rsvps = {
        status: "❌ ERROR",
        error: error.message,
        hint: error.hint,
      };
    } else {
      report.tests.rsvps = {
        status: "✅ SUCCESS",
        total_rows: count,
        sample: data,
      };
    }
  } catch (e) {
    report.tests.rsvps = { status: "❌ EXCEPTION", error: e.message };
  }

  // Test 3: Can we read from additional_guests?
  try {
    const { data, error, count } = await supabaseAdmin
      .from("additional_guests")
      .select("id, rsvp_id, name", { count: "exact" })
      .limit(3);

    if (error) {
      report.tests.additional_guests = {
        status: "❌ ERROR",
        error: error.message,
        hint: error.hint,
      };
    } else {
      report.tests.additional_guests = {
        status: "✅ SUCCESS",
        total_rows: count,
        sample: data,
      };
    }
  } catch (e) {
    report.tests.additional_guests = {
      status: "❌ EXCEPTION",
      error: e.message,
    };
  }

  // Test 4: Cross-check — find RSVPs whose guest_id exists in guests
  try {
    const { data: guests } = await supabaseAdmin
      .from("guests")
      .select("id")
      .limit(5);
    const { data: rsvps } = await supabaseAdmin
      .from("rsvps")
      .select("id, guest_id, attending")
      .limit(5);

    const guestIds = (guests || []).map((g) => g.id);
    const matchedRsvps = (rsvps || []).filter((r) =>
      guestIds.includes(r.guest_id),
    );

    report.tests.join_check = {
      status:
        matchedRsvps.length > 0 || (rsvps || []).length === 0
          ? "✅ OK"
          : "⚠️ RSVPs exist but none match any guest IDs — possible data mismatch",
      guest_ids_sample: guestIds.slice(0, 3),
      rsvp_guest_ids_sample: (rsvps || []).map((r) => r.guest_id).slice(0, 3),
      matched_count: matchedRsvps.length,
    };
  } catch (e) {
    report.tests.join_check = { status: "❌ EXCEPTION", error: e.message };
  }

  // Summary
  const allPassed = Object.values(report.tests).every((t) =>
    t.status?.startsWith("✅"),
  );
  report.summary = allPassed
    ? "✅ All checks passed. If the dashboard still shows wrong data, the issue is in the frontend."
    : "❌ One or more checks failed. Fix the issues above, then refresh this page to re-test.";

  return NextResponse.json(report, { status: 200 });
}
