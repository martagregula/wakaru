import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.client";

/**
 * Astro middleware that initializes Supabase client for each request.
 * Uses SSR cookies handling to keep sessions in sync.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createSupabaseServerInstance({
    cookies: context.cookies,
    headers: context.request.headers,
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Supabase auth error:", error.message);
  }

  context.locals.supabase = supabase;
  context.locals.user = user
    ? {
        id: user.id,
        email: user.email || "",
      }
    : null;

  return next();
});
