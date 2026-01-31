import type { TypedSupabaseClient } from "./db/supabase.client";

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_SITE_URL: string;
  readonly OPENROUTER_APP_NAME: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  namespace App {
    interface Locals {
      supabase: TypedSupabaseClient;
      user: {
        id: string;
        email: string;
      } | null;
    }
  }
}
