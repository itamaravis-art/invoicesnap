import { Resend } from "resend";
import { getHebrewMonthName } from "@/lib/utils";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not configured");
  return new Resend(key);
}

interface SendReportEmailParams {
  to: string;
  fromName: string; // The sender's display name (e.g., business name or user email)
  replyTo: string; // User's registered email - so accountant can reply directly
  businessName: string;
  year: number;
  month: number;
  totalAmount: number;
  totalVat: number;
  receiptCount: number;
  csvBuffer: Buffer;
  all?: boolean;
}

export async function sendReportEmail(params: SendReportEmailParams): Promise<{ success: boolean; error?: string }> {
  const periodLabel = params.all ? "כל הקבלות" : `${getHebrewMonthName(params.month)} ${params.year}`;
  // Use onboarding@resend.dev by default (works without domain verification)
  const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const fromDisplay = `${params.fromName} via InvoiceSnap <${fromEmail}>`;

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(n);

  try {
    const result = await getResend().emails.send({
      from: fromDisplay,
      to: params.to,
      replyTo: params.replyTo,
      subject: `InvoiceSnap - דוח קבלות ${periodLabel} - ${params.businessName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0040a1; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
            <h2 style="margin: 0; font-size: 24px;">InvoiceSnap</h2>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">דוח קבלות ${periodLabel}</p>
          </div>
          <div style="background: #f7f9fb; padding: 24px; border-radius: 0 0 12px 12px;">
            <p>שלום,</p>
            <p>מצורף דוח הקבלות של <strong>${params.businessName}</strong> לתקופת ${periodLabel}.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden;">
              <tr>
                <td style="padding: 14px; border-bottom: 1px solid #e0e3e5; color: #737785;">סה"כ הוצאות</td>
                <td style="padding: 14px; border-bottom: 1px solid #e0e3e5; font-weight: bold; text-align: left;">${formatAmount(params.totalAmount)}</td>
              </tr>
              <tr>
                <td style="padding: 14px; border-bottom: 1px solid #e0e3e5; color: #737785;">מע"מ לניכוי</td>
                <td style="padding: 14px; border-bottom: 1px solid #e0e3e5; font-weight: bold; text-align: left; color: #0040a1;">${formatAmount(params.totalVat)}</td>
              </tr>
              <tr>
                <td style="padding: 14px; color: #737785;">מספר קבלות</td>
                <td style="padding: 14px; font-weight: bold; text-align: left;">${params.receiptCount}</td>
              </tr>
            </table>

            <p style="background: #e8f0fe; padding: 12px; border-radius: 8px; border-right: 4px solid #0040a1; margin: 20px 0;">
              📎 קובץ CSV מפורט עם כל הקבלות מצורף להודעה זו
            </p>

            <p>תודה,<br/><strong>${params.businessName}</strong></p>

            <hr style="border: none; border-top: 1px solid #e0e3e5; margin: 24px 0;">
            <p style="color: #9aa0a6; font-size: 12px; margin: 0;">
              נשלח באמצעות <a href="https://invoicesnap-sigma.vercel.app" style="color: #0040a1; text-decoration: none;">InvoiceSnap</a> - ניהול קבלות חכם לעצמאים.<br/>
              להגיב ישירות ל-${params.replyTo}, פשוט לחץ "השב".
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: params.all
            ? `invoicesnap_all_receipts.csv`
            : `invoicesnap_${params.year}_${String(params.month).padStart(2, "0")}.csv`,
          content: params.csvBuffer,
        },
      ],
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, error: msg };
  }
}
