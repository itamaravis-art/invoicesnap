import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const categoryId = searchParams.get("category_id");
  const vendorId = searchParams.get("vendor_id");
  const month = searchParams.get("month"); // YYYY-MM format
  const search = searchParams.get("search");
  const offset = (page - 1) * limit;

  let query = supabase
    .from("receipts")
    .select("*, category:categories(*)", { count: "exact" })
    .eq("user_id", user.id)
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (categoryId) query = query.eq("category_id", categoryId);
  if (vendorId) query = query.eq("vendor_id", vendorId);
  if (search) query = query.or(`vendor_name.ilike.%${search}%,notes.ilike.%${search}%`);
  if (month) {
    const [y, m] = month.split("-").map(Number);
    const start = new Date(y, m - 1, 1).toISOString().split("T")[0];
    const end = new Date(y, m, 0).toISOString().split("T")[0];
    query = query.gte("receipt_date", start).lte("receipt_date", end);
  }

  const { data, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    receipts: data || [],
    total: count || 0,
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("receipts")
    .insert({
      user_id: user.id,
      image_storage_path: body.image_storage_path,
      original_filename: body.original_filename || null,
      vendor_name: body.vendor_name || null,
      receipt_date: body.receipt_date || null,
      total_amount: body.total_amount || null,
      vat_amount: body.vat_amount || null,
      amount_before_vat: body.amount_before_vat || null,
      receipt_number: body.receipt_number || null,
      payment_method: body.payment_method || null,
      currency: body.currency || "ILS",
      category_id: body.category_id || null,
      tags: body.tags || [],
      notes: body.notes || null,
      ocr_status: body.ocr_status || "pending",
      receipt_type: body.receipt_type || "receipt",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
