import type { TypedSupabaseClient } from "../../db/supabase.client";
import type { SavedItemDTO } from "../../types";
import type { Database } from "../../db/database.types";

export class SavedItemConflictError extends Error {
  constructor(message = "Item already saved") {
    super(message);
    this.name = "SavedItemConflictError";
  }
}

export class SavedItemNotFoundError extends Error {
  constructor(message = "Analysis not found") {
    super(message);
    this.name = "SavedItemNotFoundError";
  }
}

/**
 * Service for managing saved analysis items.
 */
export class SavedItemService {
  constructor(private readonly supabase: TypedSupabaseClient) {}

  /**
   * Creates a saved item for a given user and analysis.
   * Throws SavedItemNotFoundError when analysis does not exist.
   * Throws SavedItemConflictError on duplicate save attempts.
   */
  async create(userId: string, analysisId: string): Promise<SavedItemDTO> {
    const analysisExists = await this.doesAnalysisExist(analysisId);

    if (!analysisExists) {
      throw new SavedItemNotFoundError();
    }

    const { data, error } = await this.supabase
      .from("user_saved_items")
      .insert({
        user_id: userId,
        analysis_id: analysisId,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new SavedItemConflictError();
      }
      console.error("Error creating saved item:", error);
      throw new Error("Failed to create saved item");
    }

    return mapDatabaseRowToDTO(data);
  }

  /**
   * Checks whether the user already saved the analysis.
   */
  async isAnalysisSaved(userId: string, analysisId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from("user_saved_items")
      .select("id")
      .eq("user_id", userId)
      .eq("analysis_id", analysisId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return false;
      }
      console.error("Error checking saved item:", error);
      throw new Error("Failed to query saved items");
    }

    return Boolean(data?.id);
  }

  private async doesAnalysisExist(analysisId: string): Promise<boolean> {
    const { data, error } = await this.supabase.from("analyses").select("id").eq("id", analysisId).single();

    if (error) {
      if (error.code === "PGRST116") {
        return false;
      }
      console.error("Error checking analysis existence:", error);
      throw new Error("Failed to query analyses");
    }

    return Boolean(data?.id);
  }
}

function mapDatabaseRowToDTO(row: Database["public"]["Tables"]["user_saved_items"]["Row"]): SavedItemDTO {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    userId: row.user_id,
    savedAt: row.saved_at,
  };
}
