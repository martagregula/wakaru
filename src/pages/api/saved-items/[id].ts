import type { APIRoute } from "astro";
import { z } from "zod";
import { SavedItemNotFoundError, SavedItemService } from "../../../lib/services/saved-item.service";

export const prerender = false;

const SavedItemIdSchema = z.string().uuid("Invalid saved item id");

/**
 * DELETE /api/saved-items/:id
 * Deletes a saved item for the authenticated user.
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
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

    const idParam = params.id;

    if (!idParam) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: "Saved item id is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validation = SavedItemIdSchema.safeParse(idParam);

    if (!validation.success) {
      const firstError = validation.error.errors[0];

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          message: firstError.message,
          field: "id",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const service = new SavedItemService(locals.supabase);
    await service.delete(authData.user.id, validation.data);

    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof SavedItemNotFoundError) {
      return new Response(
        JSON.stringify({
          error: "Saved item not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.error("Error in DELETE /api/saved-items/:id:", error);
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
