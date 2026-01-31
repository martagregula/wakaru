import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function RegisterForm() {
  return (
    <form className="space-y-6" method="post" action="#">
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
        />
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
        />
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
        />
      </div>

      <Button className="w-full" type="submit">
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
