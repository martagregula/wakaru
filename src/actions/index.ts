import { ActionError, defineAction } from "astro:actions";
import { z } from "astro/zod";
import { createSupabaseServerInstance } from "../db/supabase.client";
import type { AuthError } from "@supabase/supabase-js";

const authErrorMessages: Record<string, string> = {
  invalid_credentials: "Nieprawidłowy adres email lub hasło.",
  user_already_exists: "Użytkownik o takim adresie email już istnieje.",
};

function resolveAuthErrorMessage(error: AuthError, fallback: string) {
  if (error.code && authErrorMessages[error.code]) {
    return authErrorMessages[error.code];
  }

  return fallback;
}

export const server = {
  auth: {
    login: defineAction({
      accept: "form",
      input: z.object({
        email: z.string().email("Podaj poprawny adres email."),
        password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków."),
      }),
      handler: async (input, context) => {
        const supabase = createSupabaseServerInstance({
          cookies: context.cookies,
          headers: context.request.headers,
        });

        const { error } = await supabase.auth.signInWithPassword({
          email: input.email,
          password: input.password,
        });

        if (error) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: resolveAuthErrorMessage(error, "Nie udało się zalogować. Spróbuj ponownie."),
          });
        }

        return { ok: true };
      },
    }),
    register: defineAction({
      accept: "form",
      input: z
        .object({
          email: z.string().email("Podaj poprawny adres email."),
          password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków."),
          passwordConfirm: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków."),
        })
        .refine((data) => data.password === data.passwordConfirm, {
          message: "Hasła muszą być takie same.",
          path: ["passwordConfirm"],
        }),
      handler: async (input, context) => {
        const supabase = createSupabaseServerInstance({
          cookies: context.cookies,
          headers: context.request.headers,
        });
        const { data, error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
        });

        if (data.user && data.user.identities?.length === 0) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: authErrorMessages.user_already_exists,
          });
        }

        if (error) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: resolveAuthErrorMessage(error, "Nie udało się zarejestrować. Spróbuj ponownie."),
          });
        }

        return { ok: true };
      },
    }),
    logout: defineAction({
      accept: "form",
      handler: async (_input, context) => {
        const supabase = createSupabaseServerInstance({
          cookies: context.cookies,
          headers: context.request.headers,
        });

        const { error } = await supabase.auth.signOut();

        if (error) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Nie udało się wylogować. Spróbuj ponownie.",
          });
        }

        return { ok: true };
      },
    }),
  },
};
