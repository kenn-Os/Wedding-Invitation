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

// Get the current dashboard password existence
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "dashboard_password")
      .single();

    if (error && error.code !== "PGRST116") throw error;

    return nocache({ exists: !!data });
  } catch (err) {
    return nocache({ error: err.message }, 500);
  }
}

// Update the password
export async function POST(req) {
  try {
    const { newPassword } = await req.json();

    if (!newPassword || newPassword.length < 4) {
      return nocache({ error: "Password must be at least 4 characters" }, 400);
    }

    const { error } = await supabaseAdmin
      .from("settings")
      .upsert({
        key: "dashboard_password",
        value: newPassword,
        updated_at: new Date(),
      });

    if (error) throw error;

    return nocache({ success: true });
  } catch (err) {
    return nocache({ error: err.message }, 500);
  }
}
