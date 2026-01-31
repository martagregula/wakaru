import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function RecoveryForm() {
  return (
    <form className="space-y-6" method="post" action="#">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="recovery-email">
          Adres email
        </label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="np. akiko@example.com"
          required
        />
        <p className="text-xs text-muted-foreground">Wyślemy link do zresetowania hasła, jeśli konto istnieje.</p>
      </div>

      <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50 p-4 text-xs text-muted-foreground">
        Link będzie ważny przez ograniczony czas. Jeśli wiadomość nie dotrze, sprawdź folder spam lub spróbuj ponownie.
      </div>

      <Button className="w-full" type="submit">
        Wyślij link resetu
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pamiętasz hasło?{" "}
        <a className="font-medium text-primary hover:underline" href="/login">
          Wróć do logowania
        </a>
      </p>
    </form>
  );
}

export { RecoveryForm };
