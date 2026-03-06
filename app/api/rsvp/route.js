import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request) {
  try {
    const body = await request.json();
    const { token, submitter_name, attending, guest_count, additional_guests } =
      body;

    if (
      !token ||
      !submitter_name ||
      attending === undefined ||
      attending === null
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields." },
        { status: 400 },
      );
    }

    // Verify token
    const { data: guest, error: guestError } = await supabaseAdmin
      .from("guests")
      .select("id, name")
      .eq("token", token)
      .single();

    if (guestError || !guest) {
      return NextResponse.json(
        { success: false, error: "Invalid invitation token." },
        { status: 400 },
      );
    }

    // Check if already submitted
    const { data: existingRsvp } = await supabaseAdmin
      .from("rsvps")
      .select("id")
      .eq("guest_id", guest.id)
      .single();

    if (existingRsvp) {
      return NextResponse.json(
        { success: false, error: "You have already submitted an RSVP." },
        { status: 400 },
      );
    }

    // Insert RSVP
    const { data: rsvp, error: rsvpError } = await supabaseAdmin
      .from("rsvps")
      .insert({
        guest_id: guest.id,
        submitter_name: submitter_name.trim(),
        attending,
        guest_count: attending ? guest_count || 0 : 0,
      })
      .select()
      .single();

    if (rsvpError) {
      console.error("RSVP insert error:", rsvpError);
      return NextResponse.json(
        { success: false, error: "Failed to save RSVP." },
        { status: 500 },
      );
    }

    // Insert additional guests
    if (attending && additional_guests && additional_guests.length > 0) {
      const guestRows = additional_guests
        .filter((name) => name && name.trim())
        .map((name) => ({ rsvp_id: rsvp.id, name: name.trim() }));

      if (guestRows.length > 0) {
        const { error: guestsError } = await supabaseAdmin
          .from("additional_guests")
          .insert(guestRows);

        if (guestsError) {
          console.error("Additional guests insert error:", guestsError);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("RSVP route error:", err);
    return NextResponse.json(
      { success: false, error: "Server error." },
      { status: 500 },
    );
  }
}
