import type { AstroCookies } from "astro";
import { createBrowserClient, createServerClient, type CookieOptionsWithName } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Type for authenticated Supabase client with full database schema
 */
export type TypedSupabaseClient = SupabaseClient<Database>;

export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,
  httpOnly: true,
  sameSite: "lax",
};

function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader
    .split(";")
    .map((cookie) => {
      const [name, ...rest] = cookie.trim().split("=");
      return { name, value: rest.join("=") };
    })
    .filter((cookie) => cookie.name);
}

export function createSupabaseServerInstance(context: {
  headers: Headers;
  cookies: AstroCookies;
}): TypedSupabaseClient {
  return createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });
}

let browserClient: TypedSupabaseClient | null = null;

export function createSupabaseBrowserClient(): TypedSupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  browserClient = createBrowserClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY);
  return browserClient;
}
