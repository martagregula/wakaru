import type { APIRoute } from "astro";
import { z } from "zod";
import type { AnalysisDTO } from "../../../types";
import { getAnalysisById } from "../../../lib/services/analysis.service";

export const prerender = false;

const QuerySchema = z.object({
  id: z.string().uuid("Invalid analysis id"),
});

/**
 * GET /api/analysis?id=<uuid>
 * Returns analysis details if the user has saved the item
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const validation = QuerySchema.safeParse({ id: url.searchParams.get("id") ?? "" });

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

    const { id: analysisId } = validation.data;

    const { data: authData, error: authError } = await locals.supabase.auth.getUser();
    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "You must be logged in to access this resource",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const analysis = await getAnalysisById(locals.supabase, analysisId, authData.user.id);
    if (!analysis) {
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Analysis not found or access denied",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const response: { analysis: AnalysisDTO } = { analysis };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/analysis:", error);
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
