import type { APIRoute } from "astro";
import { z } from "zod";
import type { CreateAnalysisCommand, CreateAnalysisResponseDTO } from "../../types";
import { generateTextHash } from "../../lib/utils/hash";
import { findAnalysisByHash, createAnalysis } from "../../lib/services/analysis.service";
import { analyzeJapaneseText } from "../../lib/services/ai.service";

export const prerender = false;

/**
 * Zod schema for validating CreateAnalysisCommand
 */
const CreateAnalysisSchema = z.object({
  originalText: z.string().trim().min(1, "Text cannot be empty").max(280, "Text cannot exceed 280 characters"),
}) satisfies z.ZodType<CreateAnalysisCommand>;

/**
 * POST /api/analyses
 * Analyzes Japanese text and returns structured morphological breakdown
 * Implements deduplication via text hashing to avoid redundant AI calls
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Parse and validate request body
    // TODO: Add authentication check when auth is implemented
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON",
          message: "Request body must be valid JSON",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validation = CreateAnalysisSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: firstError.message,
          field: firstError.path.join("."),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { originalText } = validation.data;

    // 2. Normalize and hash text for deduplication
    const normalizedText = originalText.trim();
    const textHash = await generateTextHash(normalizedText);

    // 3. Check for existing analysis (deduplication)
    const existingAnalysis = await findAnalysisByHash(locals.supabase, textHash);

    if (existingAnalysis) {
      const response: CreateAnalysisResponseDTO = {
        analysis: existingAnalysis,
        deduplicated: true,
      };

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Process with AI (mock for development)
    const aiResult = await analyzeJapaneseText(normalizedText);

    // 5. Create new analysis in database
    const newAnalysis = await createAnalysis(
      locals.supabase,
      normalizedText,
      textHash,
      aiResult.data,
      aiResult.translation
    );

    // 6. Return response
    const response: CreateAnalysisResponseDTO = {
      analysis: newAnalysis,
      deduplicated: false,
    };

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in POST /api/analyses:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred while processing your request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
