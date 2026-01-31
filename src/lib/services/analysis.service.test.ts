import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AnalysisDataDTO, AnalysisDTO } from "../../types";
import type { TypedSupabaseClient } from "../../db/supabase.client";
import * as analysisService from "./analysis.service";

type QueryResult<T> = Promise<{ data: T | null; error: { code: string; message?: string } | null }>;

function createSupabaseMock() {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    insert: vi.fn(),
    single: vi.fn(),
  };

  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.insert.mockReturnValue(query);

  const from = vi.fn(() => query);

  return {
    supabase: { from } as unknown as TypedSupabaseClient,
    query,
    from,
  };
}

const sampleAnalysisData: AnalysisDataDTO = {
  difficulty: "N5",
  romaji: "konnichiwa",
  tokens: [
    {
      surface: "こんにちは",
      dictionaryForm: "こんにちは",
      pos: "Interjection",
      reading: "こんにちは",
      definition: "hello",
    },
  ],
};

const sampleRow = {
  id: "analysis-1",
  original_text: "こんにちは",
  translation: "Hello",
  data: sampleAnalysisData,
  created_at: "2026-01-31T00:00:00Z",
};

const sampleDto: AnalysisDTO = {
  id: "analysis-1",
  originalText: "こんにちは",
  translation: "Hello",
  data: sampleAnalysisData,
  createdAt: "2026-01-31T00:00:00Z",
};

describe("analysis.service", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("findAnalysisByHash", () => {
    it("returns null when analysis is not found", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      } satisfies Awaited<QueryResult<typeof sampleRow>>);

      const result = await analysisService.findAnalysisByHash(supabase, "hash");

      expect(result).toBeNull();
    });

    it("returns null when response has no data", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single.mockResolvedValueOnce({ data: null, error: null });

      const result = await analysisService.findAnalysisByHash(supabase, "hash");

      expect(result).toBeNull();
    });

    it("throws on unexpected errors", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single.mockResolvedValueOnce({
        data: null,
        error: { code: "500", message: "boom" },
      });

      await expect(analysisService.findAnalysisByHash(supabase, "hash")).rejects.toThrow("Failed to query database");
    });

    it("maps database row to DTO", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single.mockResolvedValueOnce({
        data: sampleRow,
        error: null,
      });

      const result = await analysisService.findAnalysisByHash(supabase, "hash");

      expect(result).toMatchInlineSnapshot(`
        {
          "createdAt": "2026-01-31T00:00:00Z",
          "data": {
            "difficulty": "N5",
            "romaji": "konnichiwa",
            "tokens": [
              {
                "definition": "hello",
                "dictionaryForm": "こんにちは",
                "pos": "Interjection",
                "reading": "こんにちは",
                "surface": "こんにちは",
              },
            ],
          },
          "id": "analysis-1",
          "originalText": "こんにちは",
          "translation": "Hello",
        }
      `);
    });
  });

  describe("getAnalysisById", () => {
    it("returns null when userId is missing", async () => {
      const { supabase, from } = createSupabaseMock();

      const result = await analysisService.getAnalysisById(supabase, "analysis-1");

      expect(result).toBeNull();
      expect(from).not.toHaveBeenCalled();
    });

    it("returns null when analysis is not found", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

      const result = await analysisService.getAnalysisById(supabase, "analysis-1", "user-1");

      expect(result).toBeNull();
    });

    it("returns null when analysis is not saved by user", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single
        .mockResolvedValueOnce({ data: sampleRow, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

      const result = await analysisService.getAnalysisById(supabase, "analysis-1", "user-1");

      expect(result).toBeNull();
    });

    it("throws when analysis query fails", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single.mockResolvedValueOnce({
        data: null,
        error: { code: "500", message: "boom" },
      });

      await expect(analysisService.getAnalysisById(supabase, "analysis-1", "user-1")).rejects.toThrow(
        "Failed to query database"
      );
    });

    it("throws when saved item query fails", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single
        .mockResolvedValueOnce({ data: sampleRow, error: null })
        .mockResolvedValueOnce({ data: null, error: { code: "500", message: "boom" } });

      await expect(analysisService.getAnalysisById(supabase, "analysis-1", "user-1")).rejects.toThrow(
        "Failed to query database"
      );
    });

    it("returns analysis and saved item id when accessible", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single
        .mockResolvedValueOnce({ data: sampleRow, error: null })
        .mockResolvedValueOnce({ data: { id: "saved-1" }, error: null });

      const result = await analysisService.getAnalysisById(supabase, "analysis-1", "user-1");

      expect(result).toEqual({
        analysis: sampleDto,
        savedItemId: "saved-1",
      });
    });
  });

  describe("createAnalysis", () => {
    it("creates analysis and maps response", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single.mockResolvedValueOnce({ data: sampleRow, error: null });

      const result = await analysisService.createAnalysis(supabase, "こんにちは", "hash", sampleAnalysisData);

      expect(result).toEqual(sampleDto);
      expect(query.insert).toHaveBeenCalledWith({
        original_text: "こんにちは",
        text_hash: "hash",
        data: sampleAnalysisData,
        translation: null,
      });
    });

    it("returns existing analysis on duplicate hash", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single
        .mockResolvedValueOnce({ data: null, error: { code: "23505" } })
        .mockResolvedValueOnce({ data: sampleRow, error: null });

      const result = await analysisService.createAnalysis(supabase, "こんにちは", "hash", sampleAnalysisData);

      expect(result).toEqual(sampleDto);
    });

    it("throws when duplicate hash cannot be resolved", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single
        .mockResolvedValueOnce({ data: null, error: { code: "23505" } })
        .mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

      await expect(analysisService.createAnalysis(supabase, "こんにちは", "hash", sampleAnalysisData)).rejects.toThrow(
        "Failed to create analysis"
      );
    });

    it("throws on unexpected creation errors", async () => {
      const { supabase, query } = createSupabaseMock();
      query.single.mockResolvedValueOnce({ data: null, error: { code: "500", message: "boom" } });

      await expect(analysisService.createAnalysis(supabase, "こんにちは", "hash", sampleAnalysisData)).rejects.toThrow(
        "Failed to create analysis"
      );
    });
  });
});
