# API Endpoint Implementation Plan: POST /api/analyses

## 1. Przegląd
POST /api/analyses służy do analizy gramatycznej i morfologicznej japońskiego tekstu przesłanego przez użytkownika. System najpierw sprawdza bazę danych w poszukiwaniu istniejącej analizy dla tego samego tekstu (deduplikacja oparta na hashu), aby zaoszczędzić koszty AI. Jeśli analiza nie istnieje, tekst jest przetwarzany przez model AI (via OpenRouter), a wynik zapisywany w bazie danych.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/analyses`
- **Parametry**: Brak parametrów URL.
- **Request Body**:
  ```json
  {
    "originalText": "string" // Wymagane, max 280 znaków
  }
  ```

## 3. Wykorzystywane typy
Typy są już zdefiniowane w pliku `@src/types.ts` i należy ich użyć:
- **Request DTO**: `CreateAnalysisCommand`
- **Response DTO**: `CreateAnalysisResponseDTO`
- **Entity DTO**: `AnalysisDTO`, `AnalysisDataDTO`
- **Walidacja**: Należy utworzyć schemat Zod odpowiadający interfejsowi `CreateAnalysisCommand`.

## 3. Szczegóły odpowiedzi
- **Sukces (Nowy zasób)**: `201 Created`
- **Sukces (Istniejący zasób)**: `200 OK`
- **Struktura JSON**:
  ```json
  {
    "analysis": {
      "id": "uuid",
      "originalText": "...",
      "translation": "...",
      "data": { ... }, // AnalysisDataDTO
      "isFeatured": false,
      "createdAt": "ISO string"
    },
    "deduplicated": boolean // true jeśli pobrano z cache/DB, false jeśli nowa analiza
  }
  ```
- **Kody błędów**:
  - `400 Bad Request`: Nieprawidłowy format JSON, pusty tekst lub przekroczony limit znaków.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany (wymagane przez middleware).
  - `500 Internal Server Error`: Błąd komunikacji z OpenRouter lub błąd zapisu do bazy danych.

## 4. Przepływ danych
1. **Odebranie żądania**: Endpoint weryfikuje sesję użytkownika przez `context.locals.supabase`.
2. **Walidacja**: Sprawdzenie poprawności danych wejściowych (Zod).
3. **Normalizacja i Hashowanie**:
   - Tekst jest normalizowany (trim).
   - Generowany jest hash SHA-256 dla tekstu.
4. **Sprawdzenie duplikatów (Deduplikacja)**:
   - Zapytanie do tabeli `analyses` po kolumnie `text_hash`.
   - Jeśli rekord istnieje: zwrócenie go ze statusem `200` i `deduplicated: true`.
5. **Przetwarzanie AI (jeśli brak duplikatu)**:
   - Wywołanie serwisu AI (OpenRouter) z odpowiednim promptem systemowym.
   - Parsowanie odpowiedzi AI do struktury `AnalysisDataDTO`.
6. **Zapis do Bazy Danych**:
   - Insert do tabeli `analyses` (z wygenerowanym hashem).
7. **Odpowiedź**: Zwrócenie nowej analizy ze statusem `201` i `deduplicated: false`.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie**: TODO - Endpoint będzie dostępny tylko dla zalogowanych użytkowników w przyszłej iteracji.
- **Walidacja danych**: Ścisła walidacja `originalText` (niepusty, limit znaków) zapobiega nadużyciom i błędom parsowania.
- **Ochrona kosztów**: Mechanizm deduplikacji zapobiega wielokrotnym płatnym zapytaniom do AI dla tego samego tekstu.
- **Zmienne środowiskowe**: Klucze API (OpenRouter, Supabase) muszą być odczytywane bezpiecznie z zmiennych środowiskowych.

## 6. Obsługa błędów
- Błędy walidacji Zod -> `400` z czytelnym komunikatem.
- Błąd API AI (timeout, rate limit) -> `500` z logowaniem szczegółów błędu po stronie serwera.
- Błąd bazy danych (np. konflikt constraintów, choć mało prawdopodobny przy `text_hash` jeśli obsłużymy race condition) -> `500`.
- Wszystkie błędy systemowe powinny być logowane na konsoli serwera dla celów debugowania.

## 7. Rozważania dotyczące wydajności
- **Indeksy**: Tabela `analyses` posiada indeks na `text_hash` (zgodnie z `db-plan.md`), co zapewnia błyskawiczne wyszukiwanie duplikatów.
- **Async/Await**: Wywołania do bazy danych i zewnętrznego API muszą być asynchroniczne, aby nie blokować wątku Astro.
- **Rozmiar odpowiedzi**: JSON z analizą jest relatywnie lekki; nie przewiduje się problemów z przepustowością.

## 8. Etapy wdrożenia

1. **Konfiguracja Serwisu AI**:
   - Utworzenie `src/lib/services/ai.service.ts` (lub podobnego).
   - Implementacja funkcji `analyzeJapaneseText(text: string)`, która komunikuje się z OpenRouter i zwraca sformatowane dane. Uwaga: Na etapie developmentu skorzystamy z mocków zamiast wywoływania serwisu AI.

2. **Implementacja Serwisu Analiz**:
   - Utworzenie `src/lib/services/analysis.service.ts`.
   - Implementacja metody `findAnalysisByHash(hash: string)`.
   - Implementacja metody `createAnalysis(text: string, data: AnalysisDataDTO)`.

3. **Utworzenie Endpointu API**:
   - Utworzenie pliku `src/pages/api/analyses.ts`.
   - Zdefiniowanie schematu walidacji Zod.
   - Implementacja handlera `POST`:
     - Walidacja Body.
     - Logika biznesowa (Hash -> Check DB -> AI -> Insert).
     - Zwrócenie odpowiedzi `Response`.
   - **Note**: Weryfikacja Auth zostanie dodana w przyszłej iteracji.

4. **Testowanie**:
   - Testy manualne przy użyciu klienta HTTP (np. Thunder Client/Postman) lub `curl`.
   - Weryfikacja scenariuszy: nowy tekst, zduplikowany tekst, błędny tekst.
   - **Note**: Scenariusze autoryzacji będą testowane po implementacji auth.
