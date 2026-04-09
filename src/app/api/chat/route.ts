import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await request.json();
  if (!message || typeof message !== "string" || message.length > 500) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  // Gather user context
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [reportRes, recentRes, settingsRes] = await Promise.all([
    supabase.from("monthly_reports").select("*").eq("user_id", user.id).order("year", { ascending: false }).order("month", { ascending: false }).limit(6),
    supabase.from("receipts").select("vendor_name, total_amount, vat_amount, receipt_date, category:categories(name_he)").eq("user_id", user.id).eq("is_archived", false).order("created_at", { ascending: false }).limit(20),
    supabase.from("user_settings").select("business_name, monthly_budget, vat_rate").eq("user_id", user.id).single(),
  ]);

  const reports = reportRes.data || [];
  const receipts = recentRes.data || [];
  const settings = settingsRes.data;

  const context = `אתה עוזר AI של InvoiceSnap - מערכת ניהול קבלות לעצמאים ישראליים.
ענה בעברית, בקצרה ובידידותיות. התבסס רק על הנתונים שלהלן.

פרטי העסק: ${settings?.business_name || "לא הוגדר"}, תקציב חודשי: ${settings?.monthly_budget ? `₪${settings.monthly_budget}` : "לא הוגדר"}, שיעור מע"מ: ${settings?.vat_rate || 17}%

דוחות חודשיים אחרונים:
${reports.map(r => `${r.month}/${r.year}: ₪${r.total_amount} (${r.receipt_count} קבלות, מע"מ ₪${r.total_vat})`).join("\n")}

20 קבלות אחרונות:
${receipts.map(r => `${r.receipt_date}: ${r.vendor_name || "?"} - ₪${r.total_amount || 0} (${(r.category as unknown as Record<string,string> | null)?.name_he || "ללא קטגוריה"})`).join("\n")}

חודש נוכחי: ${currentMonth}/${currentYear}`;

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI not configured" }, { status: 500 });

  // Save user message
  await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: message });

  // Get recent chat history
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const chatHistory = (history || []).reverse().map(h => ({
    role: h.role === "user" ? "user" as const : "model" as const,
    parts: [{ text: h.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: context }] },
      { role: "model", parts: [{ text: "הבנתי! אני העוזר של InvoiceSnap. אשמח לעזור עם ניתוח הוצאות, מעקב קבלות, וניהול פיננסי. מה תרצה לדעת?" }] },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessage(message);
  const reply = result.response.text();

  // Save assistant message
  await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: reply });

  return NextResponse.json({ reply });
}
