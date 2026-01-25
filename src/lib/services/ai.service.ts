import type { AnalysisDataDTO } from "../../types";

/**
 * AI Service for Japanese text analysis
 * Currently returns mock data for development
 * TODO: Integrate with OpenRouter API
 */

/**
 * Result of AI analysis including both structured data and translation
 */
export interface AIAnalysisResult {
  data: AnalysisDataDTO;
  translation: string;
}

/**
 * Analyzes Japanese text using AI (mock implementation for development)
 * @param text - Japanese text to analyze
 * @returns Structured analysis data with translation
 */
export async function analyzeJapaneseText(text: string): Promise<AIAnalysisResult> {
  // Mock data for development
  // TODO: Replace with actual OpenRouter API call
  return {
    data: {
      difficulty: "N5",
      romaji: getMockRomaji(text),
      tokens: getMockTokens(text),
    },
    translation: getMockTranslation(text),
  };
}

/**
 * Generates mock romaji for development
 * @param text - Original Japanese text
 * @returns Mock romaji representation
 */
function getMockRomaji(text: string): string {
  // Simple mock: return lowercase version for now
  return `[mock romaji for: ${text}]`;
}

/**
 * Generates mock tokens for development
 * @param text - Original Japanese text
 * @returns Array of mock tokens
 */
function getMockTokens(text: string): AnalysisDataDTO["tokens"] {
  // Split text into characters as a simple mock
  const chars = text.split("");

  return chars.map((char, index) => ({
    surface: char,
    dictionaryForm: char,
    pos: index % 2 === 0 ? "Noun" : "Particle",
    reading: char,
    definition: `Mock definition for ${char}`,
  }));
}

/**
 * Generates mock translation for development
 * @param text - Original Japanese text
 * @returns Mock English translation
 */
function getMockTranslation(text: string): string {
  // Simple mock translation
  return `[Mock translation: "${text}"]`;
}
