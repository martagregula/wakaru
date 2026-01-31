import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface RegisterFormProps {
  action: string;
  fieldErrors?: Record<string, string[]>;
  formError?: string | null;
}

function RegisterForm({ action, fieldErrors, formError }: RegisterFormProps) {
  const emailError = fieldErrors?.email?.join(", ");
  const passwordError = fieldErrors?.password?.join(", ");
  const passwordConfirmError = fieldErrors?.passwordConfirm?.join(", ");

  return (
    <form className="space-y-6" method="post" action={action} noValidate data-testid="register-form">
      {formError ? (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
          data-testid="register-form-error"
        >
          {formError}
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="register-email">
          Adres email
        </label>
        <Input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="np. akiko@example.com"
          required
          data-testid="register-email-input"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "register-email-error" : undefined}
        />
        {emailError ? (
          <p
            className="text-xs text-destructive"
            id="register-email-error"
            role="alert"
            data-testid="register-email-error"
          >
            {emailError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="register-password">
          Hasło
        </label>
        <Input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimum 6 znaków"
          required
          minLength={6}
          data-testid="register-password-input"
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? "register-password-error" : undefined}
        />
        {passwordError ? (
          <p
            className="text-xs text-destructive"
            id="register-password-error"
            role="alert"
            data-testid="register-password-error"
          >
            {passwordError}
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Hasło powinno mieć co najmniej 6 znaków i zawierać litery lub cyfry.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="register-password-confirm">
          Potwierdź hasło
        </label>
        <Input
          id="register-password-confirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder="Powtórz hasło"
          required
          minLength={6}
          data-testid="register-password-confirm-input"
          aria-invalid={Boolean(passwordConfirmError)}
          aria-describedby={passwordConfirmError ? "register-password-confirm-error" : undefined}
        />
        {passwordConfirmError ? (
          <p
            className="text-xs text-destructive"
            id="register-password-confirm-error"
            role="alert"
            data-testid="register-password-confirm-error"
          >
            {passwordConfirmError}
          </p>
        ) : null}
      </div>

      <Button className="w-full" type="submit" data-testid="register-submit-button">
        Utwórz konto
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{" "}
        <a className="font-medium text-primary hover:underline" href="/login">
          Zaloguj się
        </a>
      </p>
    </form>
  );
}

export { RegisterForm };
