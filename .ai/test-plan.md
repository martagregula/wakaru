# Plan Testów Projektu Wakaru

## 1. Wprowadzenie i cele testowania
Celem procesu zapewnienia jakości (QA) w projekcie Wakaru jest zagwarantowanie stabilności, bezpieczeństwa i dokładności narzędzia do nauki języka japońskiego. Głównym priorytetem jest pewność, że analiza morfologiczna dostarczana przez AI jest poprawnie przetwarzana i prezentowana użytkownikowi, a dane osobowe (zapisane zdania) są bezpieczne.

Cele szczegółowe:
- Wyeliminowanie błędów krytycznych w ścieżce analizy tekstu.
- Zapewnienie spójności danych między frontendem a bazą Supabase.
- Kontrola kosztów operacyjnych poprzez efektywne strategie mockowania API w środowiskach testowych.

## 2. Zakres testów

### W zakresie (In Scope):
- **Logika biznesowa:** Serwisy `ai.service.ts`, `analysis.service.ts`.
- **API:** Endpointy REST (`/api/*`) w Astro.
- **Frontend:** Komponenty interaktywne React (formularze, widok analizy).
- **Integracja:** Połączenie z Supabase (Auth + DB) i OpenRouter.
- **Bezpieczeństwo:** Polityki RLS w bazie danych.

### Poza zakresem (Out of Scope):
- Testy wydajnościowe/obciążeniowe infrastruktury OpenRouter i Supabase (polegamy na SLA dostawców).
- Weryfikacja poprawności lingwistycznej modelu AI dla każdego możliwego zdania japońskiego (akceptujemy margines błędu modelu, testujemy poprawność struktury odpowiedzi).

## 3. Typy testów

| Typ testu | Opis | Cel |
|-----------|------|-----|
| **Jednostkowe (Unit)** | Testowanie pojedynczych funkcji i komponentów w izolacji. | Weryfikacja logiki w `src/lib`, walidacji Zod i renderowania komponentów React. |
| **Integracyjne** | Testowanie współpracy między modułami (np. API -> Service -> DB). | Sprawdzenie komunikacji z Supabase (na lokalnej instancji) i obsługi endpointów Astro. |
| **E2E (End-to-End)** | Symulacja zachowania prawdziwego użytkownika w przeglądarce. | Weryfikacja pełnych ścieżek: Rejestracja -> Analiza -> Zapis. |

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Analiza Tekstu (Core)
- **TC-01:** Użytkownik wysyła poprawny tekst japoński -> Otrzymuje kafelki z tokenami i tłumaczenie.
- **TC-02:** Użytkownik wysyła tekst nie-japoński (np. angielski) -> System zwraca błąd walidacji.
- **TC-03:** Przekroczenie limitu znaków (280) -> Blokada wysyłki lub błąd API.
- **TC-04:** Błąd zewnętrznego API (OpenRouter down) -> System wyświetla przyjazny komunikat błędu.

### 4.2. Autentykacja i Zarządzanie Kontem
- **TC-05:** Rejestracja nowego użytkownika (poprawne dane) -> Utworzenie konta w Supabase i auto-login.
- **TC-06:** Próba rejestracji na istniejący email -> Błąd walidacji.
- **TC-07:** Logowanie i wylogowanie -> Poprawne zarządzanie sesją i ciasteczkami.
- **TC-08:** Dostęp do chronionych zasobów (`/api/saved-items`) bez logowania -> Odmowa dostępu (401/403).

### 4.3. Zarządzanie Zbiorem (Library)
- **TC-09:** Zapisanie analizy -> Analiza pojawia się w "Moje Zdania".
- **TC-10:** Próba odczytu cudzych analiz -> Blokada przez RLS.
- **TC-11:** Wyszukiwanie w zapisanych zdaniach -> Filtrowanie listy po frazie japońskiej lub angielskiej.

## 5. Środowisko testowe

1.  **Lokalne (Local Development):**
    - Baza danych: Lokalna instancja Supabase (Docker).
    - API AI: Mockowane odpowiedzi.
2.  **CI (GitHub Actions):**
    - Baza danych: Tymczasowa instancja Supabase lub mocki.
    - API AI: Mockowane odpowiedzi.

## 6. Narzędzia do testowania

Zalecany stos technologiczny do wdrożenia (obecnie brak w `package.json`):

-   **Vitest:** Główny runner do testów jednostkowych i integracyjnych. Idealny dla ekosystemu Vite/Astro.
-   **React Testing Library:** Do testowania komponentów React (`AnalysisResult`, `TokenGrid`).
-   **Playwright:** Do testów E2E. Szybki, niezawodny, łatwy w konfiguracji w CI.
-   **MSW (Mock Service Worker):** Do przechwytywania i mockowania zapytań sieciowych do OpenRouter w testach integracyjnych/unitarnych.