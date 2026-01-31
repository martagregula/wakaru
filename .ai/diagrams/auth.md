# Diagram architektury autentykacji – Wakaru

## 1. Przepływy autentykacji (PRD, auth-spec)

- **Rejestracja (US-002):** Użytkownik wypełnia formularz (email, hasło). Walidacja Zod po stronie klienta. Akcja `auth.register` wywołuje `supabase.auth.signUp()`. Po sukcesie użytkownik jest automatycznie zalogowany i przekierowany.
- **Logowanie (US-003):** Formularz (email, hasło) → akcja `auth.login` → `signInWithPassword()`. Serwer ustawia ciasteczka sesyjne (access_token, refresh_token). Sukces: przekierowanie na stronę główną. Błąd: komunikat (np. „Nieprawidłowy adres email lub hasło”).
- **Weryfikacja sesji przy każdym żądaniu:** Middleware tworzy klienta Supabase z ciasteczek requestu, wywołuje `getUser()` (weryfikacja JWT). Użytkownik trafia do `context.locals.user`.
- **Odświeżanie tokenu:** Gdy token jest wygasły, middleware próbuje odświeżyć sesję i zapisuje zaktualizowane ciasteczka w odpowiedzi.
- **Wylogowanie:** Akcja `auth.logout` → `signOut()` oraz usunięcie ciasteczek sesji.

## 2. Główni aktorzy i interakcje

- **Przeglądarka:** Wyświetla strony logowania/rejestracji, wysyła formularze do Astro Actions, wysyła żądania z ciasteczkami, obsługuje przekierowania.
- **Middleware (Astro):** Czyta ciasteczka, tworzy klienta Supabase (createServerClient), wywołuje `getUser()`, ewentualnie odświeża token i ustawia `locals.user`; opcjonalnie przekierowuje niezalogowanych na `/login` dla chronionych tras.
- **Astro API (Actions + strony/endpointy):** Actions `auth.login`, `auth.register`, `auth.logout` wywołują Supabase Auth i ustawiają/usuwają ciasteczka. Strony i API używają `locals.user` lub `locals.supabase.auth.getUser()`.
- **Supabase Auth:** `signUp()`, `signInWithPassword()`, `signOut()`, weryfikacja JWT i odświeżanie tokenów.

## 3. Procesy weryfikacji i odświeżania tokenów

- **Weryfikacja:** Middleware przy każdym żądaniu wywołuje `supabase.auth.getUser()` (JWT z ciasteczek). Wynik (user lub null) jest wstrzykiwany do `context.locals.user`.
- **Odświeżanie:** Gdy token jest nieważny/wygasły, klient Supabase SSR może odświeżyć sesję; middleware zapisuje nowe ciasteczka w response, aby kolejne żądania były autoryzowane.
- **Ochrona tras:** Dla chronionych ścieżek brak `locals.user` może skutkować przekierowaniem na `/login`.

## 4. Krótki opis kroków (wybrane)

- Rejestracja: Formularz → Action → signUp → ciasteczka sesji → redirect.
- Logowanie: Formularz → Action → signInWithPassword → ustawienie ciasteczek → redirect.
- Żądanie chronione: Request z ciasteczkami → Middleware (getUser / refresh) → locals.user → strona/API korzysta z user lub zwraca 401.
- Wylogowanie: Wywołanie auth.logout → signOut + usunięcie ciasteczek.


```mermaid
sequenceDiagram
  autonumber
  participant Przegladarka
  participant Middleware
  participant AstroAPI as Astro API
  participant SupabaseAuth as Supabase Auth

  Note over Przegladarka,SupabaseAuth: Rejestracja
  activate Przegladarka
  Przegladarka->>AstroAPI: Formularz rejestracji (email, hasło)
  activate AstroAPI
  AstroAPI->>SupabaseAuth: signUp
  activate SupabaseAuth
  SupabaseAuth-->>AstroAPI: Użytkownik utworzony
  deactivate SupabaseAuth
  AstroAPI-->>Przegladarka: Ciasteczka sesji, przekieruj
  deactivate AstroAPI
  deactivate Przegladarka

  Note over Przegladarka,SupabaseAuth: Logowanie
  activate Przegladarka
  Przegladarka->>AstroAPI: Formularz logowania (email, hasło)
  activate AstroAPI
  AstroAPI->>SupabaseAuth: signInWithPassword
  activate SupabaseAuth
  alt Dane poprawne
    SupabaseAuth-->>AstroAPI: Sesja
    deactivate SupabaseAuth
    AstroAPI-->>Przegladarka: Ciasteczka sesji, przekieruj
  else Błędne dane
    SupabaseAuth-->>AstroAPI: Błąd autentykacji
    deactivate SupabaseAuth
    AstroAPI-->>Przegladarka: Komunikat błędu
  end
  deactivate AstroAPI
  deactivate Przegladarka

  Note over Przegladarka,SupabaseAuth: Żądanie z sesją – weryfikacja w Middleware
  activate Przegladarka
  Przegladarka->>Middleware: Żądanie z ciasteczkami
  activate Middleware
  Middleware->>SupabaseAuth: getUser (weryfikacja JWT)
  activate SupabaseAuth
  alt Token ważny
    SupabaseAuth-->>Middleware: Użytkownik
    deactivate SupabaseAuth
    Middleware->>Middleware: locals.user = user
    Middleware->>AstroAPI: next
  else Token wygasły
    SupabaseAuth-->>Middleware: Wymaga odświeżenia
    deactivate SupabaseAuth
    Middleware->>SupabaseAuth: Odśwież token
    activate SupabaseAuth
    SupabaseAuth-->>Middleware: Nowa sesja
    deactivate SupabaseAuth
    Middleware->>Middleware: Aktualizuj ciasteczka w response
    Middleware->>AstroAPI: next
  else Brak lub niepoprawny token
    SupabaseAuth-->>Middleware: Brak użytkownika
    deactivate SupabaseAuth
    Middleware->>Middleware: locals.user = null
    Middleware->>AstroAPI: next
  end
  deactivate Middleware
  AstroAPI-->>Przegladarka: Odpowiedź strony lub API
  deactivate Przegladarka
  deactivate AstroAPI

  Note over Przegladarka,SupabaseAuth: Chronione API
  activate Przegladarka
  Przegladarka->>Middleware: Request z ciasteczkami
  activate Middleware
  Middleware->>SupabaseAuth: getUser
  Middleware->>AstroAPI: locals.supabase, locals.user
  deactivate Middleware
  activate AstroAPI
  AstroAPI->>AstroAPI: Weryfikacja użytkownika
  alt Użytkownik zalogowany
    AstroAPI-->>Przegladarka: 200 z danymi
  else Brak użytkownika
    AstroAPI-->>Przegladarka: 401 Nieautoryzowany
  end
  deactivate AstroAPI
  deactivate Przegladarka

  Note over Przegladarka,SupabaseAuth: Wylogowanie
  activate Przegladarka
  Przegladarka->>AstroAPI: auth.logout
  activate AstroAPI
  AstroAPI->>SupabaseAuth: signOut
  activate SupabaseAuth
  SupabaseAuth-->>AstroAPI: OK
  deactivate SupabaseAuth
  AstroAPI->>AstroAPI: Usuń ciasteczka sesji
  AstroAPI-->>Przegladarka: Przekieruj
  deactivate AstroAPI
  deactivate Przegladarka
```
