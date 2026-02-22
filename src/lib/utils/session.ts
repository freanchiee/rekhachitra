import { nanoid } from "nanoid";

/**
 * Generate a 6-character uppercase alphanumeric join code.
 * Excludes easily confused characters: 0, O, I, 1
 */
export function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Generate a short unique ID for entities.
 */
export function generateId(): string {
  return nanoid(12);
}

/**
 * Format a join code with a dash for readability: ABC-123
 */
export function formatJoinCode(code: string): string {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Parse formatted join code back to raw: ABC-123 → ABC123
 */
export function parseJoinCode(input: string): string {
  return input.replace(/[-\s]/g, "").toUpperCase();
}
