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
    // ── Step 1: Fetch all guests ──────────────────────────────────────────
    const { data: guests, error: guestsError } = await supabaseAdmin
      .from("guests")
      .select("id, name, email, token, created_at")
      .order("created_at", { ascending: true });

    if (guestsError) {
      console.error("Fetch guests error:", guestsError);
      return nocache({ error: guestsError.message }, 500);
    }

    if (!guests || guests.length === 0) {
      return nocache({
        guests: [],
        stats: {
          total: 0,
          accepted: 0,
          declined: 0,
          pending: 0,
          totalGuests: 0,
        },
      });
    }

    // ── Step 2: Fetch all RSVPs for those guests ──────────────────────────
    const guestIds = guests.map((i) => i.id);

    const { data: rsvps, error: rsvpsError } = await supabaseAdmin
      .from("rsvps")
      .select(
        "id, guest_id, submitter_name, attending, guest_count, created_at",
      )
      .in("guest_id", guestIds);

    if (rsvpsError) {
      console.error("Fetch rsvps error:", rsvpsError);
      return nocache({ error: rsvpsError.message }, 500);
    }

    // ── Step 3: Fetch all additional guests for those RSVPs ─────────────────
    const rsvpIds = (rsvps || []).map((r) => r.id);

    let additionalGuests = [];
    if (rsvpIds.length > 0) {
      const { data: extraGuests, error: extraGuestsError } = await supabaseAdmin
        .from("additional_guests")
        .select("id, rsvp_id, name")
        .in("rsvp_id", rsvpIds);

      if (extraGuestsError) {
        console.error("Fetch additional_guests error:", extraGuestsError);
      } else {
        additionalGuests = extraGuests || [];
      }
    }

    // ── Step 4: Join everything together in JavaScript ──────────────────────

    // Map rsvp_id → additional guests
    const extraByRsvpId = additionalGuests.reduce((acc, guest) => {
      if (!acc[guest.rsvp_id]) acc[guest.rsvp_id] = [];
      acc[guest.rsvp_id].push({ id: guest.id, name: guest.name });
      return acc;
    }, {});

    // Map guest_id → rsvp
    const rsvpByGuestId = (rsvps || []).reduce((acc, rsvp) => {
      acc[rsvp.guest_id] = {
        ...rsvp,
        additional_guests: extraByRsvpId[rsvp.id] || [],
      };
      return acc;
    }, {});

    // Attach rsvp to each guest
    const processed = guests.map((g) => ({
      ...g,
      rsvp: rsvpByGuestId[g.id] || null,
    }));

    // ── Step 5: Calculate stats ─────────────────────────────────────────────
    const total = processed.length;
    const accepted = processed.filter((g) => g.rsvp?.attending === true).length;
    const declined = processed.filter(
      (g) => g.rsvp?.attending === false,
    ).length;
    const pending = processed.filter((g) => !g.rsvp).length;

    const totalGuests = processed.reduce((sum, g) => {
      if (g.rsvp?.attending === true) {
        return sum + 1 + (g.rsvp.guest_count || 0);
      }
      return sum;
    }, 0);

    return nocache({
      guests: processed,
      stats: { total, accepted, declined, pending, totalGuests },
    });
  } catch (err) {
    console.error("Guests GET error:", err);
    return nocache({ error: "Server error" }, 500);
  }
}

// Add guest(s) — supports batch via comma-separated names
export async function POST(request) {
  try {
    const { name, email } = await request.json();

    if (!name || !name.trim()) {
      return nocache({ error: "Name is required" }, 400);
    }

    const names = name
      .split(",")
      .map((n) => n.trim())
      .filter((n) => n !== "");
    if (names.length === 0) {
      return nocache({ error: "Valid name(s) required" }, 400);
    }

    const guestsToInsert = names.map((n) => ({
      name: n,
      email: email?.trim() || null,
      token: require("uuid").v4(),
    }));

    const { data, error } = await supabaseAdmin
      .from("guests")
      .insert(guestsToInsert)
      .select();

    if (error) throw error;

    return nocache({ success: true, guests: data });
  } catch (err) {
    console.error("Guests POST error:", err);
    return nocache({ error: err.message }, 500);
  }
}

// Bulk delete or Single delete
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Single guest delete
    if (id) {
      const { error } = await supabaseAdmin
        .from("guests")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return nocache({ success: true });
    }

    // Bulk delete all guests
    // 1. Delete all additional guests
    await supabaseAdmin
      .from("additional_guests")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // 2. Delete all RSVPs
    await supabaseAdmin
      .from("rsvps")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // 3. Delete all guests
    const { error: guestsError } = await supabaseAdmin
      .from("guests")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (guestsError) throw guestsError;

    return nocache({
      success: true,
      message: "All guest data cleared successfully",
    });
  } catch (err) {
    console.error("Guests DELETE error:", err);
    return nocache({ error: err.message }, 500);
  }
}
