import type { APIRoute } from "astro";
import { z } from "zod";
import type {
  CreateSavedItemResponseDTO,
  PaginatedSavedItemsDTO,
  SaveItemCommand,
  SavedItemsQueryParams,
} from "../../types";
import {
  SavedItemConflictError,
  SavedItemNotFoundError,
  SavedItemService,
} from "../../lib/services/saved-item.service";

export const prerender = false;

const CreateSavedItemSchema = z.object({
  analysisId: z.string().uuid("Invalid analysis id"),
}) satisfies z.ZodType<SaveItemCommand>;

const SavedItemsQuerySchema = z.object({
  q: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  sort: z.enum(["savedAt", "originalText"]).default("savedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
}) satisfies z.ZodType<SavedItemsQueryParams>;

/**
 * POST /api/saved-items
 * Saves analysis in the user's library.
 *
 * Manual test (requires authenticated session cookie):
 * curl -i -X POST http://localhost:3000/api/saved-items \
 *   -H "Content-Type: application/json" \
 *   -H "Cookie: <YOUR_SUPABASE_AUTH_COOKIE>" \
 *   -d '{"analysisId":"<analysis-uuid>"}'
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
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

    const validation = CreateSavedItemSchema.safeParse(body);

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

    const { analysisId } = validation.data;
    const service = new SavedItemService(locals.supabase);
    const savedItem = await service.create(authData.user.id, analysisId);

    const response: CreateSavedItemResponseDTO = { savedItem };
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof SavedItemNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Analysis not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (error instanceof SavedItemConflictError) {
      return new Response(
        JSON.stringify({
          error: "Item already saved",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error("Error in POST /api/saved-items:", error);
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

/**
 * GET /api/saved-items
 * Returns paginated saved analyses for the authenticated user.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
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

    const url = new URL(request.url);
    const queryParams = {
      q: url.searchParams.get("q") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      pageSize: url.searchParams.get("pageSize") ?? undefined,
      sort: url.searchParams.get("sort") ?? undefined,
      order: url.searchParams.get("order") ?? undefined,
    };

    const validation = SavedItemsQuerySchema.safeParse(queryParams);

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

    const service = new SavedItemService(locals.supabase);
    const result = await service.findAll(authData.user.id, validation.data);

    const response: PaginatedSavedItemsDTO = result;
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in GET /api/saved-items:", error);
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
