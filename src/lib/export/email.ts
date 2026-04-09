import { Resend } from "resend";
import { getHebrewMonthName } from "@/lib/utils";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || "placeholder");
}

interface SendReportEmailParams {
  to: string;
  businessName: string;
  year: number;
  month: number;
  totalAmount: number;
  totalVat: number;
  receiptCount: number;
  csvBuffer: Buffer;
}

export async function sendReportEmail(params: SendReportEmailParams): Promise<boolean> {
  const monthName = getHebrewMonthName(params.month);
  const from = process.env.EMAIL_FROM || "noreply@invoicesnap.co.il";

  const formatAmount = (n: number) =>
    new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" }).format(n);

  try {
    await getResend().emails.send({
      from,
      to: params.to,
      subject: `InvoiceSnap - \u05E7\u05D1\u05DC\u05D5\u05EA \u05D7\u05D5\u05D3\u05E9 ${monthName} ${params.year} - ${params.businessName}`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0040a1;">InvoiceSnap</h2>
          <h3>\u05D3\u05D5\u05D7 \u05E7\u05D1\u05DC\u05D5\u05EA - ${monthName} ${params.year}</h3>
          <p>\u05E2\u05E1\u05E7: <strong>${params.businessName}</strong></p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background: #f2f4f6;">
              <td style="padding: 12px; border: 1px solid #e0e3e5;">\u05E1\u05D4"\u05DB \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA</td>
              <td style="padding: 12px; border: 1px solid #e0e3e5; font-weight: bold;">${formatAmount(params.totalAmount)}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #e0e3e5;">\u05DE\u05E2"\u05DE \u05DC\u05E0\u05D9\u05DB\u05D5\u05D9</td>
              <td style="padding: 12px; border: 1px solid #e0e3e5; font-weight: bold;">${formatAmount(params.totalVat)}</td>
            </tr>
            <tr style="background: #f2f4f6;">
              <td style="padding: 12px; border: 1px solid #e0e3e5;">\u05DE\u05E1\u05E4\u05E8 \u05E7\u05D1\u05DC\u05D5\u05EA</td>
              <td style="padding: 12px; border: 1px solid #e0e3e5; font-weight: bold;">${params.receiptCount}</td>
            </tr>
          </table>
          <p>\u05DE\u05E6\u05D5\u05E8\u05E3 \u05E7\u05D5\u05D1\u05E5 CSV \u05E2\u05DD \u05E4\u05D9\u05E8\u05D5\u05D8 \u05DB\u05DC \u05D4\u05E7\u05D1\u05DC\u05D5\u05EA.</p>
          <p style="color: #737785; font-size: 12px; margin-top: 30px;">
            \u05E0\u05E9\u05DC\u05D7 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA \u05DE-InvoiceSnap
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `invoicesnap_${params.year}_${String(params.month).padStart(2, "0")}.csv`,
          content: params.csvBuffer,
        },
      ],
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}
