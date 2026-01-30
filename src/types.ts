/**
 * Data Transfer Objects (DTOs) and Command Models for Wakaru API
 */

// =============================================================================
// Analysis DTOs
// =============================================================================

/** Part of speech tag */
export type PartOfSpeech =
  | "Noun"
  | "Verb"
  | "Adjective"
  | "Adverb"
  | "Particle"
  | "Conjunction"
  | "Interjection"
  | "Pronoun"
  | "Determiner"
  | "Preposition"
  | "Auxiliary"
  | "Other";

/** JLPT difficulty level */
export type JLPTLevel = "N5" | "N4" | "N3" | "N2" | "N1";

/** Morphological token in the analysis */
export interface TokenDTO {
  surface: string;
  /** Dictionary/base form (null for particles and grammatical elements) */
  dictionaryForm: string | null;
  /** Part of speech tag */
  pos: PartOfSpeech;
  reading: string;
  definition: string;
}

/** Structured analysis data */
export interface AnalysisDataDTO {
  difficulty: JLPTLevel;
  romaji: string;
  tokens: TokenDTO[];
}

/** Complete analysis response */
export interface AnalysisDTO {
  id: string;
  originalText: string;
  translation: string | null;
  data: AnalysisDataDTO;
  createdAt: string;
}

/** Input for POST /api/analyses (max 280 chars) */
export interface CreateAnalysisCommand {
  originalText: string;
}

/** Response for POST /api/analyses */
export interface CreateAnalysisResponseDTO {
  analysis: AnalysisDTO;
  deduplicated: boolean;
}

// =============================================================================
// Saved Items DTOs
// =============================================================================

/** User's saved analysis reference */
export interface SavedItemDTO {
  id: string;
  analysisId: string;
  userId: string;
  savedAt: string;
}

/** Saved item with full analysis details */
export interface SavedItemWithAnalysisDTO {
  savedItemId: string;
  savedAt: string;
  analysis: AnalysisDTO;
}

/** Input for POST /api/saved-items */
export interface SaveItemCommand {
  analysisId: string;
}

/** Response for POST /api/saved-items */
export interface CreateSavedItemResponseDTO {
  savedItem: SavedItemDTO;
}

/** Response for GET /api/saved-items */
export interface PaginatedSavedItemsDTO {
  items: SavedItemWithAnalysisDTO[];
  page: number;
  pageSize: number;
  total: number;
}

// =============================================================================
// Query Parameter Types
// =============================================================================

/** Common pagination and search query parameters */
export interface ListQueryParams {
  /** Search query (searches original text and translation) */
  q?: string;
  /** Page number (1-indexed, default: 1) */
  page?: number;
  /** Items per page (default: 20, max: 50) */
  pageSize?: number;
  sort?: string;
  /** Sort order (default: desc) */
  order?: "asc" | "desc";
}

/** Query parameters for GET /api/saved-items */
export interface SavedItemsQueryParams extends ListQueryParams {
  sort?: "savedAt" | "originalText";
}
