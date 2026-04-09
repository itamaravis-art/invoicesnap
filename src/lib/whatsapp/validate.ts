import { createHmac } from "crypto";

export function validateTwilioSignature(url: string, params: Record<string, string>, signature: string): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const sorted = Object.keys(params).sort();
  let data = url;
  for (const key of sorted) data += key + params[key];

  const expected = createHmac("sha1", authToken).update(data).digest("base64");
  return expected === signature;
}
