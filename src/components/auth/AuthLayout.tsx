import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthLayoutProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  user?: AuthUser | null;
  logoutAction?: string;
}

function AuthLayout({ title, description, children, footer, className, user, logoutAction }: AuthLayoutProps) {
  const isLoggedIn = Boolean(user?.id);
  const resolvedLogoutAction = logoutAction ?? "/logout";
  const canLogout = isLoggedIn && resolvedLogoutAction;

  return (
    <section
      className={cn("relative flex min-h-screen items-center justify-center px-4 py-12", className)}
      data-auth-layout
    >
      <div className="w-full max-w-md">
        {isLoggedIn ? (
          <div
            className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/70 px-4 py-3 text-sm text-foreground/80 shadow-sm backdrop-blur"
            data-testid="auth-logged-in-banner"
          >
            <span aria-live="polite">Zalogowano jako {user?.email}</span>
            {canLogout ? (
              <form method="post" action={resolvedLogoutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  aria-label="Wyloguj się z aplikacji"
                  data-testid="auth-logout-button"
                >
                  Wyloguj się
                </Button>
              </form>
            ) : null}
          </div>
        ) : null}
        <Card className="border-white/15 bg-white/95 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
            {description ? <CardDescription className="text-base">{description}</CardDescription> : null}
          </CardHeader>
          <CardContent>{children}</CardContent>
          {footer ? (
            <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">{footer}</CardFooter>
          ) : null}
        </Card>
      </div>
    </section>
  );
}

export { AuthLayout };
