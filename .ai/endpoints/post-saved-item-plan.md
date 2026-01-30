<analysis>
1. **Specyfikacja API**:
   - Endpoint: `POST /api/saved-items`
   - Cel: Zapisanie analizy w bibliotece użytkownika.
   - Request Body: `{ "analysisId": "uuid" }`
   - Response (201): `{ "savedItem": { ... } }`
   - Kody błędów: 400 (walidacja), 401 (auth), 404 (brak analizy), 409 (duplikat).

2. **Parametry**:
   - Wymagane: `analysisId` (w body).
   - Auth: Wymagane uwierzytelnienie (token sesji/cookie).

3. **Typy (DTOs/Command)**:
   - Istniejące w `src/types.ts`: `SaveItemCommand`, `SavedItemDTO`, `CreateSavedItemResponseDTO`.
   - Baza danych: Tabela `user_saved_items` (zdefiniowana w `src/db/database.types.ts`).

4. **Service**:
   - Brak dedykowanego serwisu dla zapisanych elementów.
   - Zalecane utworzenie: `src/lib/services/saved-item.service.ts`.
   - Funkcje: `createSavedItem(userId, analysisId)`, `isAnalysisSaved(userId, analysisId)`.

5. **Walidacja**:
   - Zod schema dla body (`analysisId` musi być UUID).
   - Sprawdzenie istnienia analizy w bazie danych.
   - Sprawdzenie duplikatów (constraint database'owy lub check w serwisie).

6. **Bezpieczeństwo**:
   - Tylko zalogowani użytkownicy.
   - `userId` pobierane z kontekstu sesji (Supabase auth), NIE z body requestu.
   - RLS w bazie danych (już zdefiniowane w planie DB) dodatkowo zabezpiecza, ale API powinno to obsłużyć wcześniej.

7. **Błędy**:
   - Mapowanie błędów Postgresa (np. unique constraint violation -> 409).
   - Walidacja Zod -> 400.
</analysis>

# API Endpoint Implementation Plan: Save Analysis Item

## 1. Przegląd punktu końcowego
Punkt końcowy `POST /api/saved-items` umożliwia zalogowanym użytkownikom zapisanie konkretnej analizy (identyfikowanej przez `analysisId`) w ich osobistej bibliotece ("My Saved Items"). Zapobiega to duplikowaniu zapisów tej samej analizy przez tego samego użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/saved-items`
- **Parametry**: Brak parametrów URL/Query.
- **Nagłówki**: Wymagane nagłówki uwierzytelniania (obsługiwane przez Supabase auth cookie).
- **Request Body** (JSON):
  ```json
  {
    "analysisId": "123e4567-e89b-12d3-a456-426614174000"
  }
  ```

## 3. Wykorzystywane typy
Implementacja będzie korzystać z istniejących typów zdefiniowanych w `src/types.ts`:

- **Command Model** (wejście): `SaveItemCommand`
  ```typescript
  export interface SaveItemCommand {
    analysisId: string;
  }
  ```
- **DTO** (wyjście): `SavedItemDTO`
  ```typescript
  export interface SavedItemDTO {
    id: string;
    analysisId: string;
    userId: string;
    savedAt: string;
  }
  ```
- **Response Wrapper**: `CreateSavedItemResponseDTO`
  ```typescript
  export interface CreateSavedItemResponseDTO {
    savedItem: SavedItemDTO;
  }
  ```

## 3. Szczegóły odpowiedzi
- **Status 201 Created**: Pomyślnie zapisano element.
- **Body**:
  ```json
  {
    "savedItem": {
      "id": "uuid",
      "analysisId": "uuid",
      "userId": "uuid",
      "savedAt": "ISO-8601 Timestamp"
    }
  }
  ```

## 4. Przepływ danych
1. **API Endpoint**: Otrzymuje żądanie, sprawdza sesję użytkownika (Context Locals).
2. **Walidacja**: Waliduje poprawność payloadu (UUID) za pomocą Zod.
3. **Serwis (`SavedItemService`)**:
   - Sprawdza, czy podana analiza istnieje w tabeli `analyses`.
   - Próbuje wstawić nowy rekord do tabeli `user_saved_items` używając `userId` z sesji.
4. **Baza Danych (Supabase)**:
   - Weryfikuje unikalność pary `(user_id, analysis_id)`.
   - Zwraca utworzony rekord.
5. **API Endpoint**: Mapuje wynik na `SavedItemDTO` i zwraca odpowiedź JSON.

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie**: Endpoint musi weryfikować, czy użytkownik jest zalogowany (`locals.user` lub `supabase.auth.getUser()`). Jeśli nie – zwrot 401.
- **Autoryzacja**: Użytkownik może zapisywać elementy tylko dla siebie (`userId` pochodzi z tokena, nie z body).
- **Walidacja danych**: `analysisId` musi być poprawnym UUID v4. Użycie biblioteki Zod do parsowania.

## 6. Obsługa błędów
| Scenariusz | Kod HTTP | Komunikat/Body |
|------------|----------|----------------|
| Brak sesji użytkownika | 401 Unauthorized | `{"error": "Unauthorized"}` |
| Nieprawidłowy format ID | 400 Bad Request | Zod error details |
| Analiza nie istnieje | 404 Not Found | `{"error": "Analysis not found"}` |
| Element już zapisany | 409 Conflict | `{"error": "Item already saved"}` |
| Błąd bazy danych | 500 Internal Server Error | `{"error": "Internal server error"}` |

## 7. Rozważania dotyczące wydajności
- Tabela `user_saved_items` posiada (zgodnie z planem DB) indeks na `(user_id, saved_at)` oraz `analysis_id`, co zapewnia szybkie sprawdzanie duplikatów i pobieranie listy.
- Sprawdzenie istnienia analizy i insert powinny być obsłużone efektywnie przez Postgres.

## 8. Etapy wdrożenia

### Krok 1: Utworzenie Serwisu
Utwórz plik `src/lib/services/saved-item.service.ts`. Zaimplementuj klasę `SavedItemService` z metodą `create`.
- Metoda powinna przyjmować `userId` oraz `analysisId`.
- Powinna sprawdzać istnienie analizy (można ponownie użyć `AnalysisService` lub wykonać proste zapytanie count/select).
- Powinna obsługiwać błąd duplikatu (Postgres error code `23505`) i rzucać odpowiedni wyjątek lub zwracać null, który API obsłuży jako 409.

### Krok 2: Utworzenie Endpointu API
Utwórz plik `src/pages/api/saved-items.ts`.
- Ustaw `export const prerender = false`.
- Zaimplementuj obsługę metody `POST`.
- Pobierz instancję Supabase z `context.locals`.
- Sprawdź sesję użytkownika.

### Krok 3: Implementacja Walidacji i Logiki
- Wewnątrz endpointu użyj `z.object({ analysisId: z.string().uuid() })` do walidacji body.
- Wywołaj `SavedItemService.create`.
- Obsłuż możliwe rezultaty serwisu (sukces, błąd duplikatu, błąd braku analizy).

### Krok 4: Testowanie (Manualne/Unit)
- Przetestuj zapisanie istniejącej analizy (oczekiwane 201).
- Przetestuj ponowne zapisanie tej samej analizy (oczekiwane 409).
- Przetestuj zapisanie nieistniejącej analizy (oczekiwane 404).
- Przetestuj żądanie bez logowania (oczekiwane 401).
