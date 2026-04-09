import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", user.id)
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.name_he || typeof body.name_he !== "string" || body.name_he.trim().length === 0 || body.name_he.length > 100) {
    return NextResponse.json({ error: "Invalid category name" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      user_id: user.id,
      name_he: body.name_he,
      name_en: body.name_en || null,
      color: body.color || "#6366f1",
      icon: body.icon || "receipt_long",
      is_system: false,
      sort_order: body.sort_order || 99,
      tax_code: body.tax_code || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
