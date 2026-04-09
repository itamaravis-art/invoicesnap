import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveDriveClient } from "@/lib/gdrive/sync";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { year, month, accountant_email } = body;

  if (!year || !month || !accountant_email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const client = await getActiveDriveClient(user.id);
  if (!client) {
    return NextResponse.json({ error: "Google Drive not connected" }, { status: 400 });
  }

  const { data: connection } = await supabase
    .from("gdrive_connections")
    .select("root_folder_id")
    .eq("user_id", user.id)
    .single();

  if (!connection?.root_folder_id) {
    return NextResponse.json({ error: "Drive folder not found" }, { status: 400 });
  }

  try {
    const yearFolderId = await client.ensureFolder(String(year), connection.root_folder_id);
    const monthStr = String(month).padStart(2, "0");
    const monthFolder = await client.findFolder(`${monthStr}`, yearFolderId);

    if (!monthFolder) {
      return NextResponse.json({ error: "No receipts synced for this month" }, { status: 404 });
    }

    await client.shareWithEmail(monthFolder, accountant_email, "reader");

    // Update report status
    await supabase
      .from("monthly_reports")
      .update({
        sent_to_accountant_at: new Date().toISOString(),
        sent_method: "drive",
        status: "sent",
      })
      .eq("user_id", user.id)
      .eq("year", year)
      .eq("month", month);

    return NextResponse.json({
      success: true,
      shared_with: accountant_email,
      folder_url: `https://drive.google.com/drive/folders/${monthFolder}`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to share folder" }, { status: 500 });
  }
}
