import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Type for authenticated Supabase client with full database schema
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

/**
 * Creates a Supabase client instance with proper typing
 * Used in middleware and server-side operations
 */
export function createSupabaseClient(supabaseUrl: string, supabaseKey: string): TypedSupabaseClient {
  return createClient<Database>(supabaseUrl, supabaseKey);
}

/**
 * Creates a Supabase client with user session (server-side auth)
 * This is used in API routes via context.locals.supabase
 */
export function createSupabaseServerClient(
  supabaseUrl: string,
  supabaseKey: string,
  accessToken?: string,
  refreshToken?: string
): TypedSupabaseClient {
  const client = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers:
        accessToken && refreshToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {},
    },
  });

  return client;
}
