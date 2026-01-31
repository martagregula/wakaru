import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  return (
    <form className="space-y-6" method="post" action="#">
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
        />
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
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Logujesz się do swojego konta.</span>
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
