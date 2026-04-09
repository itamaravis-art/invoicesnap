import { createClient } from "@/lib/supabase/server";
import { decrypt, encrypt } from "./crypto";
import { refreshAccessToken } from "./auth";
import { DriveClient } from "./client";
import { getHebrewMonthName } from "@/lib/utils";

export async function getActiveDriveClient(userId: string): Promise<DriveClient | null> {
  const supabase = await createClient();

  const { data: connection } = await supabase
    .from("gdrive_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (!connection) return null;

  let accessToken = decrypt(connection.access_token_encrypted);
  const refreshToken = decrypt(connection.refresh_token_encrypted);

  // Check if token is expired
  const expiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : new Date(0);
  if (expiresAt <= new Date()) {
    try {
      const newTokens = await refreshAccessToken(refreshToken);
      accessToken = newTokens.access_token;

      // Save new encrypted token
      await supabase
        .from("gdrive_connections")
        .update({
          access_token_encrypted: encrypt(accessToken),
          token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
        })
        .eq("id", connection.id);
    } catch {
      // Token refresh failed - mark inactive
      await supabase
        .from("gdrive_connections")
        .update({ is_active: false, last_sync_error: "Token refresh failed" })
        .eq("id", connection.id);
      return null;
    }
  }

  return new DriveClient(accessToken);
}

export async function syncReceiptToDrive(
  userId: string,
  receiptId: string
): Promise<boolean> {
  const supabase = await createClient();
  const client = await getActiveDriveClient(userId);
  if (!client) return false;

  // Get connection for root folder ID
  const { data: connection } = await supabase
    .from("gdrive_connections")
    .select("root_folder_id")
    .eq("user_id", userId)
    .single();

  if (!connection?.root_folder_id) return false;

  // Get receipt
  const { data: receipt } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", receiptId)
    .eq("user_id", userId)
    .single();

  if (!receipt || receipt.gdrive_synced) return true;

  try {
    // Download image from Supabase Storage
    const { data: fileData } = await supabase.storage
      .from("receipts")
      .download(receipt.image_storage_path);

    if (!fileData) return false;

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const receiptDate = receipt.receipt_date ? new Date(receipt.receipt_date) : new Date(receipt.created_at);
    const year = receiptDate.getFullYear().toString();
    const month = String(receiptDate.getMonth() + 1).padStart(2, "0");
    const monthName = getHebrewMonthName(receiptDate.getMonth() + 1);

    // Ensure folder structure: InvoiceSnap/{year}/{month - monthName}/
    const yearFolderId = await client.ensureFolder(year, connection.root_folder_id);
    const monthFolderName = `${month} - ${monthName}`;
    const monthFolderId = await client.ensureFolder(monthFolderName, yearFolderId);

    // Upload receipt image
    const vendor = receipt.vendor_name || "unknown";
    const amount = receipt.total_amount || "0";
    const ext = receipt.image_storage_path.split(".").pop() || "jpg";
    const fileName = `${receipt.receipt_date || "nodate"}_${vendor}_${amount}.${ext}`;

    const driveFileId = await client.uploadFile(fileName, buffer, fileData.type, monthFolderId);

    // Update receipt
    await supabase
      .from("receipts")
      .update({
        gdrive_synced: true,
        gdrive_file_id: driveFileId,
        gdrive_synced_at: new Date().toISOString(),
      })
      .eq("id", receiptId);

    // Update connection last_sync
    await supabase
      .from("gdrive_connections")
      .update({ last_sync_at: new Date().toISOString(), last_sync_error: null })
      .eq("user_id", userId);

    return true;
  } catch (error) {
    await supabase
      .from("gdrive_connections")
      .update({ last_sync_error: String(error) })
      .eq("user_id", userId);
    return false;
  }
}
