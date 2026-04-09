import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/gdrive/crypto";
import { revokeToken } from "@/lib/gdrive/auth";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: connection } = await supabase
    .from("gdrive_connections")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (connection) {
    try {
      const accessToken = decrypt(connection.access_token_encrypted);
      await revokeToken(accessToken);
    } catch {
      // Token may already be revoked
    }

    await supabase
      .from("gdrive_connections")
      .delete()
      .eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}
