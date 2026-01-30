# API Endpoint Implementation Plan: Get Analysis Details

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania szczegółów pojedynczej analizy językowej. Dostęp do zasobu jest warunkowy:

- Analiza jest dostępna tylko dla użytkownika, który ma ją zapisaną w swoich "Saved Items".

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/analyses/[id]`
- **Parametry:**
  - **Wymagane:** `id` (path parameter) — unikalny identyfikator UUID analizy.
  - **Opcjonalne:** brak.
- **Request Body:** brak.

## 3. Wykorzystywane typy

- **DTO:** `AnalysisDTO` (zdefiniowany w `src/types.ts`).
- **Parametry:** `z.string().uuid()` (walidacja Zod).

## 4. Szczegóły odpowiedzi

- **Sukces (200 OK):**
  ```json
  {
    "analysis": {
      "id": "uuid",
      "originalText": "...",
      "translation": "...",
      "data": { ... },
      "createdAt": "ISO-8601 string"
    }
  }
  ```

- **Błędy:**
  - `400 Bad Request` — podane ID nie jest poprawnym UUID.
  - `401 Unauthorized` — użytkownik nie jest zalogowany.
  - `404 Not Found` — analiza nie istnieje lub użytkownik nie ma do niej uprawnień.
  - `500 Internal Server Error` — błąd połączenia z bazą danych.

## 5. Przepływ danych

1. **Odbiór żądania:** Astro router kieruje żądanie do `src/pages/api/analyses/[id].ts`.
2. **Walidacja:** Weryfikacja formatu UUID parametru `id`.
3. **Kontekst użytkownika:** Pobranie ID zalogowanego użytkownika z `context.locals.supabase`.
4. **Warstwa serwisu:** Wywołanie `AnalysisService.getAnalysisById(supabase, analysisId, userId)`:
   - Zapytanie do tabeli `analyses` po ID.
   - Sprawdzenie obecności rekordu w `user_saved_items` dla danego użytkownika.
5. **Odpowiedź:** Mapowanie wyniku bazy danych na `AnalysisDTO` i zwrot JSON.

## 6. Względy bezpieczeństwa

- **Autoryzacja dostępu:** Logika biznesowa musi ściśle kontrolować dostęp. Nie zwracać analiz niepublicznych, jeśli użytkownik nie ma ich w `saved_items`.
- **Walidacja wejścia:** Ścisła walidacja UUID zapobiega nieprawidłowym zapytaniom (Supabase i tak parametryzuje zapytania).

## 7. Obsługa błędów

- Błędy walidacji Zod → `400` z komunikatem o błędnym formacie ID.
- Błędy Supabase → logowanie na serwerze i zwrot `500`.
- Brak wyniku w serwisie → `404`.

## 8. Rozważania dotyczące wydajności

- Zapytanie do bazy: jeden SELECT po `analyses.id`, ewentualnie drugi SELECT do `user_saved_items`.
- Tabela `analyses` ma indeks na kluczu głównym `id`. Indeks na `user_saved_items(user_id, analysis_id)` ułatwia sprawdzenie zapisów.

## 9. Etapy wdrożenia

1. **Rozszerzenie serwisu** — w `src/lib/services/analysis.service.ts` dodać funkcję `getAnalysisById(supabase, analysisId, userId?)`:
   - Pobranie analizy z `analyses` po `id`.
   - Jeśli brak rekordu → `null`.
   - Jeśli użytkownik niezalogowany (`!userId`) → `null`.
   - Sprawdzenie `user_saved_items` dla `user_id` i `analysis_id`; jeśli jest wpis → zwróć DTO, w przeciwnym razie `null`.

2. **Utworzenie endpointu** — plik `src/pages/api/analyses/[id].ts`:
   - `export const prerender = false`.
   - Handler `GET`: walidacja `params.id` (Zod UUID), pobranie `supabase` z `context.locals`, sesji użytkownika (opcjonalnie `userId`), wywołanie `getAnalysisById`, zwrot `200` z `{ analysis }` lub `404`/`401`/`400`/`500` zgodnie z logiką błędów.