# API Endpoint Implementation Plan: Get Saved Items

## 1. Przegląd punktu końcowego
Ten punkt końcowy umożliwia zalogowanemu użytkownikowi pobranie listy zapisanych analiz (Saved Items). Obsługuje paginację, sortowanie oraz wyszukiwanie tekstowe (w oryginalnym tekście i tłumaczeniu).

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/saved-items`
- **Parametry zapytania (Query Parameters)**:
  - **Wymagane**: Brak.
  - **Opcjonalne**:
    - `q` (string): Fraza wyszukiwania (szuka w `originalText` lub `translation`).
    - `page` (number): Numer strony (domyślnie 1).
    - `pageSize` (number): Ilość elementów na stronie (domyślnie 20, max 50).
    - `sort` (string): Pole sortowania. Dozwolone: `savedAt`, `originalText` (domyślnie `savedAt`).
    - `order` (string): Kierunek sortowania. Dozwolone: `asc`, `desc` (domyślnie `desc`).
- **Request Body**: Brak.

## 3. Wykorzystywane typy
Typy są już zdefiniowane w `src/types.ts`.
- **Input**: `SavedItemsQueryParams` (do typowania parametrów wejściowych).
- **Output**: `PaginatedSavedItemsDTO` (struktura odpowiedzi).
- **Element**: `SavedItemWithAnalysisDTO` (pojedynczy element listy).

## 3. Szczegóły odpowiedzi
- **Status 200 OK**: Zwraca obiekt JSON zgodny z `PaginatedSavedItemsDTO`.
  ```json
  {
    "items": [
      {
        "savedItemId": "uuid",
        "savedAt": "ISO-Date",
        "analysis": {
           "id": "uuid",
           "originalText": "...",
           "translation": "...",
           "data": { ... },
           "createdAt": "ISO-Date"
        }
      }
    ],
    "page": 1,
    "pageSize": 20,
    "total": 5
  }
  ```
- **Status 400 Bad Request**: Nieprawidłowe parametry zapytania (np. `page` nie jest liczbą).
- **Status 401 Unauthorized**: Użytkownik nie jest zalogowany.
- **Status 500 Internal Server Error**: Błąd serwera/bazy danych.

## 4. Przepływ danych
1.  **Klient**: Wysyła żądanie `GET /api/saved-items` z parametrami.
2.  **API Route (`src/pages/api/saved-items/index.ts`)**:
    *   Sprawdza sesję użytkownika (`context.locals.user`). Jeśli brak -> 401.
    *   Waliduje i parsuje parametry query string za pomocą `zod`. Jeśli błąd -> 400.
    *   Wywołuje `SavedItemService.findAll()`.
3.  **Service (`SavedItemService`)**:
    *   Buduje zapytanie do Supabase (`user_saved_items` join `analyses`).
    *   Aplikuje filtry (`user_id`, opcjonalnie `q` w tabeli `analyses`).
    *   Aplikuje sortowanie (z obsługą sortowania po tabeli powiązanej).
    *   Aplikuje paginację (`range`).
    *   Mapuje wynik z bazy danych na `PaginatedSavedItemsDTO`.
4.  **Supabase**: Wykonuje zapytanie i zwraca dane.
5.  **API Route**: Zwraca odpowiedź JSON (200).

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint dostępny tylko dla zalogowanych użytkowników. Weryfikacja przez `Astro.locals.user`.
- **Autoryzacja danych**: Zapytanie do bazy danych musi zawierać warunek `.eq('user_id', user.id)`, aby użytkownik widział tylko swoje wpisy.
- **Walidacja**: `zod` zapobiega wstrzyknięciu nieprawidłowych typów danych i ogranicza wartości (np. `pageSize` max 50).

## 6. Obsługa błędów
- Błędy walidacji `zod` -> sformatowana odpowiedź JSON z kodem 400.
- Wyjątki z serwisu (np. błąd połączenia z DB) -> logowanie błędu na serwerze i odpowiedź JSON z kodem 500 (`{ "error": "Internal Server Error" }`).

## 7. Rozważania dotyczące wydajności
- **Indeksy**: Baza danych (wg planu DB) powinna posiadać indeksy na `user_saved_items(user_id, saved_at)` oraz indeksy GIN na polach tekstowych `analyses` dla wydajnego wyszukiwania (`pg_trgm`).
- **Paginacja**: Użycie `limit` i `offset` (via `.range()`) zapobiega pobieraniu zbyt dużej ilości danych.
- **Select**: Pobieramy tylko potrzebne kolumny (lub `*` jeśli wszystkie są potrzebne do DTO).

## 8. Etapy wdrożenia

### Krok 1: Rozszerzenie `SavedItemService`
W pliku `src/lib/services/saved-item.service.ts`:
- Dodać metodę `findAll(userId: string, params: SavedItemsQueryParams): Promise<PaginatedSavedItemsDTO>`.
- Zaimplementować logikę budowania zapytania Supabase:
  - Join z tabelą `analyses` (`analyses!inner(*)`).
  - Obsługa parametru `q` przy użyciu `.or(..., { foreignTable: 'analyses' })`.
  - Obsługa sortowania dynamicznego (jeśli `originalText`, sortuj po tabeli powiązanej).
  - Mapowanie wyników (surowy wynik z Supabase -> `SavedItemWithAnalysisDTO`).

### Krok 2: Utworzenie API Endpoint
Utworzyć plik `src/pages/api/saved-items/index.ts`:
- Ustawić `prerender = false`.
- Zdefiniować schemat walidacji parametrów query za pomocą `zod` (`z.coerce.number()`, `z.enum()`).
- Zaimplementować handler `GET`:
  - Pobranie `user` z `context.locals`.
  - Parsowanie query params (`new URL(request.url).searchParams`).
  - Wywołanie serwisu.
  - Zwrócenie `Response` z JSON.

### Krok 3: Testowanie manualne
- Sprawdzić pobieranie listy (domyślne parametry).
- Sprawdzić sortowanie (`asc`/`desc`, `savedAt`/`originalText`).
- Sprawdzić wyszukiwanie (`q`).
- Sprawdzić paginację.
- Sprawdzić dostęp bez logowania (oczekiwane 401).
