import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper — attach no-cache headers to every response so the browser
// never serves a stale copy when the host clicks Refresh.
function nocache(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export async function GET() {
  try {
    // ── Step 1: Fetch all invitees ──────────────────────────────────────────
    const { data: invitees, error: inviteesError } = await supabaseAdmin
      .from("invitees")
      .select("id, name, email, token, created_at")
      .order("created_at", { ascending: true });

    if (inviteesError) {
      console.error("Fetch invitees error:", inviteesError);
      return nocache({ error: inviteesError.message }, 500);
    }

    if (!invitees || invitees.length === 0) {
      return nocache({
        invitees: [],
        stats: {
          total: 0,
          accepted: 0,
          declined: 0,
          pending: 0,
          totalGuests: 0,
        },
      });
    }

    // ── Step 2: Fetch all RSVPs for those invitees ──────────────────────────
    const inviteeIds = invitees.map((i) => i.id);

    const { data: rsvps, error: rsvpsError } = await supabaseAdmin
      .from("rsvps")
      .select(
        "id, invitee_id, submitter_name, attending, guest_count, created_at",
      )
      .in("invitee_id", inviteeIds);

    if (rsvpsError) {
      console.error("Fetch rsvps error:", rsvpsError);
      return nocache({ error: rsvpsError.message }, 500);
    }

    // ── Step 3: Fetch all additional guests for those RSVPs ─────────────────
    const rsvpIds = (rsvps || []).map((r) => r.id);

    let additionalGuests = [];
    if (rsvpIds.length > 0) {
      const { data: guests, error: guestsError } = await supabaseAdmin
        .from("additional_guests")
        .select("id, rsvp_id, name")
        .in("rsvp_id", rsvpIds);

      if (guestsError) {
        console.error("Fetch additional_guests error:", guestsError);
        // Non-fatal — continue without additional guest names
      } else {
        additionalGuests = guests || [];
      }
    }

    // ── Step 4: Join everything together in JavaScript ──────────────────────

    // Map rsvp_id → additional guests
    const guestsByRsvpId = additionalGuests.reduce((acc, guest) => {
      if (!acc[guest.rsvp_id]) acc[guest.rsvp_id] = [];
      acc[guest.rsvp_id].push({ id: guest.id, name: guest.name });
      return acc;
    }, {});

    // Map invitee_id → rsvp (with additional guests attached)
    const rsvpByInviteeId = (rsvps || []).reduce((acc, rsvp) => {
      acc[rsvp.invitee_id] = {
        ...rsvp,
        additional_guests: guestsByRsvpId[rsvp.id] || [],
      };
      return acc;
    }, {});

    // Attach rsvp to each invitee
    const processed = invitees.map((inv) => ({
      ...inv,
      rsvp: rsvpByInviteeId[inv.id] || null,
    }));

    // ── Step 5: Calculate stats ─────────────────────────────────────────────
    const total = processed.length;
    const accepted = processed.filter((i) => i.rsvp?.attending === true).length;
    const declined = processed.filter(
      (i) => i.rsvp?.attending === false,
    ).length;
    const pending = processed.filter((i) => !i.rsvp).length;

    const totalGuests = processed.reduce((sum, inv) => {
      if (inv.rsvp?.attending === true) {
        return sum + 1 + (inv.rsvp.guest_count || 0);
      }
      return sum;
    }, 0);

    return nocache({
      invitees: processed,
      stats: { total, accepted, declined, pending, totalGuests },
    });
  } catch (err) {
    console.error("Guests API error:", err);
    return nocache({ error: "Server error" }, 500);
  }
}

// Bulk delete all guests (Invitees, RSVPs, Additional Guests)
export async function DELETE() {
  try {
    // 1. Delete all additional guests
    const { error: guestsError } = await supabaseAdmin
      .from("additional_guests")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (guestsError) throw guestsError;

    // 2. Delete all RSVPs
    const { error: rsvpsError } = await supabaseAdmin
      .from("rsvps")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (rsvpsError) throw rsvpsError;

    // 3. Delete all invitees
    const { error: inviteesError } = await supabaseAdmin
      .from("invitees")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (inviteesError) throw inviteesError;

    return nocache({
      success: true,
      message: "All guest data cleared successfully",
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    return nocache(
      { error: "Failed to clear guest list: " + err.message },
      500,
    );
  }
}
