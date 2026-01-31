# Specyfikacja Techniczna: Moduł Autentykacji i Zarządzania Kontem

## Wstęp
Niniejszy dokument definiuje architekturę techniczną modułu rejestracji i logowania dla aplikacji Wakaru. Rozwiązanie opiera się na **Supabase Auth** (backend) oraz **Astro 5 + React** (frontend), wykorzystując tryb renderowania Server-Side Rendering (SSR) zdefiniowany w konfiguracji projektu.

Cel: Realizacja wymagań US-002 (Rejestracja) i US-003 (Logowanie) zgodnie z PRD.

---

## 1. Architektura Interfejsu Użytkownika (Frontend)

### 1.1. Struktura Stron (Astro Pages)
Wszystkie strony autentykacji będą renderowane po stronie serwera (SSR), aby zapewnić szybkie ładowanie i bezpieczeństwo.

*   **`/src/pages/login.astro`**: Strona logowania.
    *   Zawiera komponent React `LoginForm`.
    *   Przekierowuje na stronę główną, jeśli użytkownik ma już aktywną sesję.
*   **`/src/pages/register.astro`**: Strona rejestracji.
    *   Zawiera komponent React `RegisterForm`.
    *   Przekierowuje, jeśli użytkownik jest zalogowany.
*   **`/src/pages/auth/callback.ts`**: Endpoint API (nie strona UI) obsługujący przekierowania z linków emailowych (np. potwierdzenie rejestracji) w celu wymiany kodu `code` na sesję.

### 1.2. Komponenty (React & Shadcn/ui)
Logika formularzy i interakcja z użytkownikiem (walidacja w czasie rzeczywistym) zostanie obsłużona przez komponenty React ("islands").

*   **`AuthLayout.tsx`**: Wrapper dla stron autentykacji, zapewniający spójny wygląd (np. wycentrowana karta na tle).
*   **`LoginForm.tsx`**:
    *   Pola: Email, Hasło.
    *   Akcja: Wywołanie Astro Action `actions.auth.login`.
    *   Obsługa błędów: Wyświetlanie komunikatów z `AuthError` (np. "Błędne dane logowania").
*   **`RegisterForm.tsx`**:
    *   Pola: Email, Hasło, Potwierdź hasło.
    *   Walidacja klienta (Zod): Sprawdzenie formatu email i zgodności haseł przed wysłaniem.
    *   Akcja: Wywołanie Astro Action `actions.auth.register`.
*   **Zarządzanie Stanem UI**:
    *   Wykorzystanie `react-hook-form` do obsługi formularzy.
    *   Wykorzystanie `zod` do walidacji schematów po stronie klienta.
    *   Wykorzystanie komponentu `Toast` (Shadcn/ui) do powiadomień o sukcesie/błędzie.

### 1.3. Integracja z Layoutem
*   **`Layout.astro`**:
    *   Musi dynamicznie renderować nagłówek w zależności od stanu `Astro.locals.user`.
    *   Jeśli `user` istnieje: Pokaż przycisk "Wyloguj" i "Moje Zdania".
    *   Jeśli `user` brak: Pokaż przyciski "Zaloguj" i "Zarejestruj".

---

## 2. Logika Backendowa (Astro Server)

Ze względu na wykorzystanie Astro 5, rekomendowanym sposobem obsługi logiki formularzy są **Astro Actions**. Zastępują one tradycyjne endpointy API (`pages/api/*`), zapewniając pełne bezpieczeństwo typów (type-safety) między klientem a serwerem.

### 2.1. Astro Actions (`src/actions/index.ts`)
Zdefiniowanie przestrzeni nazw `auth` z następującymi akcjami:

1.  **`auth.register`**:
    *   Input: `email`, `password`.
    *   Logika: Wywołanie `supabase.auth.signUp()`.
    *   Wynik: Utworzenie użytkownika. W przypadku sukcesu komunikat o konieczności potwierdzenia emaila.
2.  **`auth.login`**:
    *   Input: `email`, `password`.
    *   Logika: Wywołanie `supabase.auth.signInWithPassword()`.
    *   Kluczowe: Ustawienie ciasteczek sesyjnych (access_token, refresh_token) w odpowiedzi serwera, aby kolejne requesty były autoryzowane.
3.  **`auth.logout`**:
    *   Logika: Wywołanie `supabase.auth.signOut()` i usunięcie ciasteczek.

### 2.2. Middleware (`src/middleware/index.ts`)
Istniejący middleware wymaga aktualizacji, aby obsłużyć odświeżanie tokenów (token refresh) i poprawną propagację sesji przy użyciu `@supabase/ssr`.

*   **Zadania Middleware:**
    1.  Tworzenie klienta Supabase z kontekstem ciasteczek requestu (`createServerClient`).
    2.  Wywołanie `supabase.auth.getUser()`, aby zweryfikować token JWT (bezpieczniejsze niż `getSession`).
    3.  Jeśli token wygasł, próba jego odświeżenia i aktualizacja ciasteczek (response cookies).
    4.  Wstrzyknięcie obiektu użytkownika do `context.locals.user`, aby był dostępny w stronach `.astro`.
    5.  Opcjonalnie: Ochrona tras (redirect do `/login` dla chronionych ścieżek, jeśli brak usera).

### 2.3. Konfiguracja Serwera (`astro.config.mjs`)
Upewnienie się, że `output: 'server'` jest aktywne (już jest skonfigurowane w projekcie), co pozwala na dynamiczne zarządzanie ciasteczkami.

---

## 3. System Autentykacji (Supabase Integration)

Należy zmigrować (lub rozszerzyć) obecną implementację klienta Supabase, aby wykorzystać oficjalną bibliotekę `@supabase/ssr`. Jest to standard dla frameworków SSR takich jak Astro.

### 3.1. Zależności
Dodanie biblioteki:
*   `@supabase/ssr`: Do obsługi ciasteczek i sesji po stronie serwera.

### 3.2. Klienty Supabase (`src/lib/supabase.ts` lub aktualizacja `src/db/`)
Należy rozdzielić logikę tworzenia klienta na:
1.  **Server Client** (używany w Middleware i Actions): Ma dostęp do `cookies` z obiektu `Astro`.
2.  **Browser Client** (używany w komponentach React): Singleton używający `createBrowserClient` do interakcji po stronie klienta (np. nasłuchiwanie na zmiany stanu autentykacji `onAuthStateChange`).

### 3.3. Modele Danych
*   **Tabela `auth.users`**: Zarządzana automatycznie przez Supabase. Zawiera UID, email, hasło (hash).
*   **Wymagania US-002/US-003**: Nie wymagają dodatkowych pól w bazie danych na tym etapie, wystarczy standardowy model Supabase Auth.

### 3.4. Walidacja i Bezpieczeństwo
*   **Walidacja haseł**: Minimum 6 znaków (standard Supabase).
*   **Walidacja Email**: Sprawdzanie formatu regex po stronie klienta (Zod) i serwera (Supabase).
*   **Obsługa Błędów**: Mapowanie kodów błędów Supabase na komunikaty przyjazne użytkownikowi (PL):
    *   `invalid_credentials` -> "Nieprawidłowy adres email lub hasło."
    *   `user_already_exists` -> "Użytkownik o takim adresie email już istnieje."

---

## Podsumowanie Implementacji
1.  **Instalacja**: `npm install @supabase/ssr`.
2.  **Backend**: Aktualizacja `src/middleware/index.ts` oraz implementacja `src/actions/index.ts` (Auth Actions).
3.  **Frontend**: Utworzenie stron w `src/pages/` oraz formularzy w `src/components/auth/`.
4.  **Integracja**: Podpięcie stanu autentykacji w `Layout.astro`.
