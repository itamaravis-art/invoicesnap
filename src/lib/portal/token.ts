import { randomBytes } from "crypto";

export function generatePortalToken(): string {
  return randomBytes(32).toString("base64url");
}
