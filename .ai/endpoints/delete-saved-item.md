# API Endpoint Implementation Plan: Delete Saved Item

## 1. Przegląd punktu końcowego
Punkt końcowy umożliwia uwierzytelnionym użytkownikom usunięcie analizy z ich listy "Zapisanych elementów" (Saved Items). Operacja jest nieodwracalna.

## 2. Szczegóły żądania
- **Metoda HTTP**: `DELETE`
- **Struktura URL**: `/api/saved-items/[id]` (gdzie `[id]` to UUID zapisanego elementu, a nie analizy)
- **Parametry**:
  - **Path Params (Wymagane)**:
    - `id`: UUID (identyfikator rekordu w tabeli `user_saved_items`)
- **Request Body**: Brak.

## 3. Wykorzystywane typy
- **Input Validation**: `z.string().uuid()` (dla parametru ścieżki).
- **Service**: Aktualizacja `SavedItemService`.

## 3. Szczegóły odpowiedzi
- **Sukces (204 No Content)**:
  - Brak treści odpowiedzi.
- **Błędy**:
  - `400 Bad Request`: Nieprawidłowy format ID.
  - `401 Unauthorized`: Użytkownik nie jest zalogowany.
  - `404 Not Found`: Element o podanym ID nie istnieje w bibliotece użytkownika.
  - `500 Internal Server Error`: Błąd po stronie serwera/bazy danych.

## 4. Przepływ danych
1. **Astro Route** (`src/pages/api/saved-items/[id].ts`):
   - Odbiera żądanie DELETE.
   - Sprawdza sesję użytkownika (`context.locals.user`).
   - Waliduje format parametru `id` za pomocą Zod.
2. **Service Layer** (`SavedItemService`):
   - Wywołuje metodę `delete(userId, savedItemId)`.
3. **Database** (Supabase):
   - Wykonuje operację `DELETE FROM user_saved_items WHERE id = :id AND user_id = :userId`.
   - Zwraca informację o liczbie usuniętych wierszy.
4. **Response**:
   - Jeśli liczba usuniętych wierszy > 0: Zwraca 204.
   - Jeśli liczba usuniętych wierszy == 0: Rzuca błąd `SavedItemNotFoundError` (mapowany na 404).

## 5. Względy bezpieczeństwa
- **Uwierzytelnianie**: Wymagane sprawdzenie `context.locals.user` przed podjęciem jakichkolwiek działań.
- **Autoryzacja (RLS)**: Tabela `user_saved_items` ma politykę RLS pozwalającą na usuwanie tylko własnych rekordów (`user_id = auth.uid()`).
- **Data Validation**: Ścisła walidacja UUID zapobiega atakom typu SQL Injection (choć Supabase parameterization i tak to obsługuje).
- **Idempotency**: Zgodnie ze specyfikacją HTTP, DELETE powinien być idempotentny, ale specyfikacja API wymaga 404 jeśli zasób nie istnieje. Plan uwzględnia ten wymóg.

## 6. Obsługa błędów
- **Błędy walidacji (Zod)** -> Zwróć `400 Bad Request` z opisem błędu.
- **SavedItemNotFoundError** -> Zwróć `404 Not Found`.
- **Błędy bazy danych** -> Loguj błąd na serwerze i zwróć `500 Internal Server Error`.

## 7. Rozważania dotyczące wydajności
- Operacja usuwania po kluczu głównym (`id`) jest bardzo szybka (O(1)).
- Indeks na `id` jest tworzony automatycznie jako PK.

## 8. Etapy wdrożenia

### Krok 1: Aktualizacja serwisu `SavedItemService`
W pliku `src/lib/services/saved-item.service.ts`:
- Dodać metodę `delete(userId: string, savedItemId: string): Promise<void>`.
- Metoda powinna używać klienta Supabase do usunięcia rekordu.
- Należy sprawdzić `count` z odpowiedzi Supabase. Jeśli `count === 0`, rzucić `SavedItemNotFoundError`.

### Krok 2: Utworzenie pliku endpointu
Utworzyć plik `src/pages/api/saved-items/[id].ts` (zwróć uwagę na nawiasy kwadratowe dla parametru dynamicznego Astro).

### Krok 3: Implementacja handlera DELETE
W nowym pliku:
- Zaimplementować funkcję `export const DELETE: APIRoute`.
- Pobrać użytkownika z `context.locals`. Jeśli brak -> 401.
- Pobrać `id` z `context.params`.
- Zwalidować `id` używając `z.string().uuid()`. Jeśli błąd -> 400.
- Zainicjować `SavedItemService` przekazując `context.locals.supabase`.
- Wywołać `service.delete(user.id, id)`.
- Obsłużyć błędy (`SavedItemNotFoundError` -> 404, inne -> 500).
- Zwrócić `new Response(null, { status: 204 })` w przypadku sukcesu.
