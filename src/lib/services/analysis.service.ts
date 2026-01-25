import type { TypedSupabaseClient } from "../../db/supabase.client";
import type { AnalysisDTO, AnalysisDataDTO } from "../../types";
import type { Database } from "../../db/database.types";

/**
 * Service for managing analysis entities in the database
 */

/**
 * Finds an existing analysis by its text hash
 * @param supabase - Authenticated Supabase client
 * @param textHash - SHA-256 hash of the normalized text
 * @returns Analysis entity or null if not found
 */
export async function findAnalysisByHash(supabase: TypedSupabaseClient, textHash: string): Promise<AnalysisDTO | null> {
  const { data, error } = await supabase.from("analyses").select("*").eq("text_hash", textHash).single();

  if (error) {
    // Not found is expected behavior, not an error
    if (error.code === "PGRST116") {
      return null;
    }
    console.error("Error finding analysis by hash:", error);
    throw new Error("Failed to query database");
  }

  if (!data) {
    return null;
  }

  return mapDatabaseRowToDTO(data);
}

/**
 * Creates a new analysis in the database
 * @param supabase - Authenticated Supabase client
 * @param originalText - Original Japanese text
 * @param textHash - SHA-256 hash of the normalized text
 * @param analysisData - Structured analysis data from AI
 * @param translation - English translation (optional)
 * @returns Created analysis entity
 * @throws Error if creation fails or if duplicate hash exists (race condition)
 */
export async function createAnalysis(
  supabase: TypedSupabaseClient,
  originalText: string,
  textHash: string,
  analysisData: AnalysisDataDTO,
  translation?: string
): Promise<AnalysisDTO> {
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      original_text: originalText,
      text_hash: textHash,
      data: analysisData as unknown as Database["public"]["Tables"]["analyses"]["Insert"]["data"],
      translation: translation || null,
      is_featured: false,
    })
    .select()
    .single();

  if (error) {
    // Handle race condition: another request created the same analysis
    if (error.code === "23505") {
      // Unique constraint violation - try to fetch the existing analysis
      const existing = await findAnalysisByHash(supabase, textHash);
      if (existing) {
        return existing;
      }
    }
    console.error("Error creating analysis:", error);
    throw new Error("Failed to create analysis");
  }

  return mapDatabaseRowToDTO(data);
}

/**
 * Maps database row to AnalysisDTO
 * @param row - Database row from analyses table
 * @returns AnalysisDTO
 */
function mapDatabaseRowToDTO(row: Database["public"]["Tables"]["analyses"]["Row"]): AnalysisDTO {
  return {
    id: row.id,
    originalText: row.original_text,
    translation: row.translation,
    data: row.data as unknown as AnalysisDataDTO,
    isFeatured: row.is_featured,
    createdAt: row.created_at,
  };
}
