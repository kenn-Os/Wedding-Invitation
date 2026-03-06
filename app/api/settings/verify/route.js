import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

function nocache(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}

// Verify the password
export async function POST(req) {
  try {
    const { password } = await req.json();

    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "dashboard_password")
      .single();

    // Fallback to default if table/key doesn't exist yet
    const correctPassword = data?.value || "mildymylove";

    if (password === correctPassword) {
      return nocache({ success: true });
    }

    return nocache({ success: false }, 401);
  } catch (err) {
    console.error("Verification error:", err);
    return nocache({ error: "Verification failed" }, 500);
  }
}
