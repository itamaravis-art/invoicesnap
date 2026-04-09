import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateCSV } from "@/lib/export/csv";
import archiver from "archiver";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { year, month } = body;

  if (!year || !month) {
    return NextResponse.json({ error: "Missing year or month" }, { status: 400 });
  }

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split("T")[0];

  const { data: receipts } = await supabase
    .from("receipts")
    .select("*, category:categories(name_he)")
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .gte("receipt_date", startDate)
    .lte("receipt_date", endDate)
    .order("receipt_date");

  if (!receipts || receipts.length === 0) {
    return NextResponse.json({ error: "No receipts found" }, { status: 404 });
  }

  // Generate CSV
  const csvRows = receipts.map((r) => ({
    ...r,
    category_name: (r.category as { name_he: string } | null)?.name_he || null,
  }));
  const csv = generateCSV(csvRows, year, month);

  // Create ZIP archive
  const archive = archiver("zip", { zlib: { level: 9 } });
  const chunks: Buffer[] = [];

  archive.on("data", (chunk: Buffer) => chunks.push(chunk));

  const prefix = `invoicesnap_${year}_${String(month).padStart(2, "0")}`;

  // Add CSV
  archive.append(csv, { name: `${prefix}/summary.csv` });

  // Add receipt images
  for (const receipt of receipts) {
    try {
      const { data: fileData } = await supabase.storage
        .from("receipts")
        .download(receipt.image_storage_path);

      if (fileData) {
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const vendor = (receipt.vendor_name || "unknown").replace(/[/\\?%*:|"<>]/g, "_");
        const amount = receipt.total_amount || "0";
        const ext = receipt.image_storage_path.split(".").pop() || "jpg";
        const fileName = `${receipt.receipt_date || "nodate"}_${vendor}_${amount}.${ext}`;

        archive.append(buffer, { name: `${prefix}/receipts/${fileName}` });
      }
    } catch {
      // Skip files that fail to download - ZIP will contain available files only
    }
  }

  await archive.finalize();
  await new Promise<void>((resolve) => archive.on("end", resolve));

  const zipBuffer = Buffer.concat(chunks);

  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${prefix}.zip"`,
    },
  });
}
