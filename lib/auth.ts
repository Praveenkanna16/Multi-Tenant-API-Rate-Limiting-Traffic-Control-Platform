import { createHash, randomBytes } from "crypto";

export function generateApiKey(): { apiKey: string; keyHash: string } {
  const randomHex = randomBytes(24).toString("hex");
  const apiKey = `qf_live_${randomHex}`;
  const keyHash = hashApiKey(apiKey);
  return { apiKey, keyHash };
}

export function hashApiKey(apiKey: string): string {
  return createHash("sha256").update(apiKey).digest("hex");
}

export function verifyApiKey(apiKey: string, storedHash: string): boolean {
  const inputHash = hashApiKey(apiKey);
  return inputHash === storedHash;
}
