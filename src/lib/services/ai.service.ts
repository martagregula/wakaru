import { z } from "zod";
import type { AnalysisDataDTO, JLPTLevel, PartOfSpeech } from "../../types";
import type { Message } from "./openrouter.service";
import { OpenRouterParseError, OpenRouterService } from "./openrouter.service";

/**
 * AI Service for Japanese text analysis
 */

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1"] as const satisfies JLPTLevel[];

const PARTS_OF_SPEECH = [
  "Noun",
  "Verb",
  "Adjective",
  "Adverb",
  "Particle",
  "Conjunction",
  "Interjection",
  "Pronoun",
  "Determiner",
  "Preposition",
  "Auxiliary",
  "Other",
] as const satisfies PartOfSpeech[];

const TokenSchema = z.object({
  surface: z.string().min(1),
  dictionaryForm: z.string().nullable(),
  pos: z.enum(PARTS_OF_SPEECH),
  reading: z.string().min(1),
  definition: z.string().min(1),
});

const AIResponseSchema = z.object({
  translation: z.string().min(1),
  difficulty: z.enum(JLPT_LEVELS),
  romaji: z.string().min(1),
  tokens: z.array(TokenSchema).min(1),
});

type AIResponse = z.infer<typeof AIResponseSchema>;

const SYSTEM_PROMPT = `
You are a Japanese language teacher specializing in clear, structured explanations.
Analyze the user's Japanese text and return STRICT JSON that matches the provided schema.

Tasks:
- Perform morphological analysis and tokenization.
- Provide a natural English translation of the full text.
- Include romaji for the full text.
- Provide beginner-friendly definitions for each token.
- Choose an appropriate JLPT difficulty level for the full text.

Token rules:
- surface: token as it appears in the original text.
- dictionaryForm: base form (null for particles or pure grammar tokens).
- pos: one of the allowed part-of-speech tags in the schema.
- reading: kana reading for the token.
- definition: concise English meaning.

If the text is unclear or nonsensical, make a best effort analysis and mark tokens as "Other".
Return ONLY valid JSON.
`.trim();

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
  if (!text.trim()) {
    throw new Error("Cannot analyze empty text");
  }

  const openRouterService = new OpenRouterService();
  const messages: Message[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: text },
  ];

  const completion = await openRouterService.complete(messages, {
    model: "openai/gpt-4o-mini",
    schema: AIResponseSchema,
    schemaName: "analysis_response",
    temperature: 0.2,
  });

  if (typeof completion.content === "string") {
    throw new OpenRouterParseError("OpenRouter returned unstructured content");
  }

  return mapAIResponse(completion.content);
}

function mapAIResponse(response: AIResponse): AIAnalysisResult {
  return {
    translation: response.translation,
    data: {
      difficulty: response.difficulty,
      romaji: response.romaji,
      tokens: response.tokens,
    },
  };
}
