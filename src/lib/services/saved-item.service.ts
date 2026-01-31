import type { TypedSupabaseClient } from "../../db/supabase.client";
import type {
  AnalysisDTO,
  AnalysisDataDTO,
  PaginatedSavedItemsDTO,
  SavedItemDTO,
  SavedItemWithAnalysisDTO,
  SavedItemsQueryParams,
} from "../../types";
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
   * Deletes a saved item for the given user.
   * Throws SavedItemNotFoundError when the saved item does not exist.
   */
  async delete(userId: string, savedItemId: string): Promise<void> {
    const { error, count } = await this.supabase
      .from("user_saved_items")
      .delete({ count: "exact" })
      .eq("id", savedItemId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting saved item:", error);
      throw new Error("Failed to delete saved item");
    }

    if (count === null) {
      console.error("Delete saved item returned no count");
      throw new Error("Failed to delete saved item");
    }

    if (count === 0) {
      throw new SavedItemNotFoundError("Saved item not found");
    }
  }

  /**
   * Lists saved items for a user with pagination, sorting, and search.
   */
  async findAll(userId: string, params: SavedItemsQueryParams): Promise<PaginatedSavedItemsDTO> {
    const { q, page = 1, pageSize = 20, sort = "savedAt", order = "desc" } = params;

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = this.supabase
      .from("user_saved_items")
      .select("id, saved_at, analyses!inner(id, original_text, translation, data, created_at)", { count: "exact" })
      .eq("user_id", userId);

    if (q && q.trim().length > 0) {
      const sanitizedQuery = q.trim();
      query = query.or(`original_text.ilike.%${sanitizedQuery}%,translation.ilike.%${sanitizedQuery}%`, {
        foreignTable: "analyses",
      });
    }

    if (sort === "originalText") {
      query = query.order("original_text", {
        foreignTable: "analyses",
        ascending: order === "asc",
      });
    } else {
      query = query.order("saved_at", { ascending: order === "asc" });
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("Error fetching saved items:", error);
      throw new Error("Failed to fetch saved items");
    }

    const items = (data ?? []).map(mapSavedItemWithAnalysisRowToDTO);

    return {
      items,
      page,
      pageSize,
      total: count ?? 0,
    };
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

type AnalysisRowSelection = Pick<
  Database["public"]["Tables"]["analyses"]["Row"],
  "id" | "original_text" | "translation" | "data" | "created_at"
>;

type SavedItemWithAnalysisRow = Pick<Database["public"]["Tables"]["user_saved_items"]["Row"], "id" | "saved_at"> & {
  analyses: AnalysisRowSelection | null;
};

function mapDatabaseRowToDTO(row: Database["public"]["Tables"]["user_saved_items"]["Row"]): SavedItemDTO {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    userId: row.user_id,
    savedAt: row.saved_at,
  };
}

function mapAnalysisRowToDTO(row: AnalysisRowSelection): AnalysisDTO {
  return {
    id: row.id,
    originalText: row.original_text,
    translation: row.translation,
    data: row.data as unknown as AnalysisDataDTO,
    createdAt: row.created_at,
  };
}

function mapSavedItemWithAnalysisRowToDTO(row: SavedItemWithAnalysisRow): SavedItemWithAnalysisDTO {
  if (!row.analyses) {
    throw new Error("Missing analysis data for saved item");
  }

  return {
    savedItemId: row.id,
    savedAt: row.saved_at,
    analysis: mapAnalysisRowToDTO(row.analyses),
  };
}
