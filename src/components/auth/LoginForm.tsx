import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LoginFormProps {
  action: string;
  fieldErrors?: Record<string, string[]>;
  formError?: string | null;
}

function LoginForm({ action, fieldErrors, formError }: LoginFormProps) {
  const emailError = fieldErrors?.email?.join(", ");
  const passwordError = fieldErrors?.password?.join(", ");

  return (
    <form className="space-y-6" method="post" action={action} noValidate>
      {formError ? (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {formError}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="login-email">
          Adres email
        </label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="np. akiko@example.com"
          required
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "login-email-error" : undefined}
        />
        {emailError ? (
          <p className="text-xs text-destructive" id="login-email-error" role="alert">
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="login-password">
          Hasło
        </label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Wpisz hasło"
          required
          minLength={6}
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "login-password-error" : undefined}
        />
        {passwordError ? (
          <p className="text-xs text-destructive" id="login-password-error" role="alert">
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end text-sm">
        <a className="font-medium text-primary hover:underline" href="/recover">
          Nie pamiętasz hasła?
        </a>
      </div>

      <Button className="w-full" type="submit">
        Zaloguj się
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{" "}
        <a className="font-medium text-primary hover:underline" href="/register">
          Zarejestruj się
        </a>
      </p>
    </form>
  );
}

export { LoginForm };
