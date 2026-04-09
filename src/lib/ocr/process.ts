import { GoogleGenerativeAI } from "@google/generative-ai";
import { OCR_SYSTEM_PROMPT } from "./prompt";
import { validateOcrResult } from "./validate";
import type { OcrResult } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function processReceiptImage(imageBuffer: Buffer, mimeType: string): Promise<OcrResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  });

  const imagePart = {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType,
    },
  };

  const result = await model.generateContent([OCR_SYSTEM_PROMPT, imagePart]);
  const response = result.response;
  const text = response.text();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      vendor_name: null,
      receipt_date: null,
      total_amount: null,
      vat_amount: null,
      amount_before_vat: null,
      receipt_number: null,
      payment_method: null,
      receipt_type: "receipt",
      currency: "ILS",
      language: "he",
      confidence: 0,
      line_items: [],
      raw_text: text,
    };
  }

  return validateOcrResult(parsed);
}
