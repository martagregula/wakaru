/**
 * Utility functions for hashing text
 */

/**
 * Generates SHA-256 hash of text
 * @param text - Text to hash
 * @returns Hexadecimal hash string
 */
export async function generateTextHash(text: string): Promise<string> {
  const normalized = text.trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
