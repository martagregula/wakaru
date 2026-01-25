import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerClient } from "../db/supabase.client";

/**
 * Astro middleware that initializes Supabase client for each request
 * Makes the client available via context.locals.supabase in API routes
 */
export const onRequest = defineMiddleware((context, next) => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;

  // Get session tokens from cookies (if they exist)
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  // Create Supabase client with session
  context.locals.supabase = createSupabaseServerClient(supabaseUrl, supabaseKey, accessToken, refreshToken);

  return next();
});
