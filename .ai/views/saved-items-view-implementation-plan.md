# Plan implementacji widoku Moje Zdania (Saved Items)

## 1. Przegląd
Widok "Moje Zdania" umożliwia zalogowanym użytkownikom przeglądanie historii zapisanych analiz. Zapewnia funkcjonalność listy z nieskończonym przewijaniem (infinite scroll), wyszukiwanie w czasie rzeczywistym oraz możliwość usuwania elementów. Jest to kluczowy element personalizacji, pozwalający na powrót do wcześniej przerobionego materiału.

## 2. Routing widoku
- **Ścieżka:** `/saved`
- **Plik Astro:** `src/pages/saved/index.astro`
- **Dostęp:** Wymagana autentykacja (chroniona trasa). Przekierowanie do `/login` w przypadku braku sesji.

## 3. Struktura komponentów

```text
src/pages/saved/index.astro (Page Wrapper & Auth Check)
└── SavedItemsView.tsx (Main Container)
    ├── SavedItemsHeader.tsx (Title & Search)
    │   └── SearchBar.tsx (Input with debounce)
    ├── SavedItemsList.tsx (List Container)
    │   ├── SavedItemCard.tsx (Individual Item)
    │   │   └── DeleteButton.tsx (Optional: separate for logic isolation)
    │   └── LoadingSentinel.tsx (Intersection Observer target)
    ├── SavedItemsSkeleton.tsx (Loading State)
    └── EmptyState.tsx (No results/items)
```

## 4. Szczegóły komponentów

### `SavedItemsView`
- **Opis:** Główny kontener zarządzający stanem widoku (pobieranie danych, paginacja, wyszukiwanie).
- **Główne elementy:** `div` (layout), `SavedItemsHeader`, `SavedItemsList` lub `SavedItemsSkeleton`.
- **Obsługiwane interakcje:** Inicjalizacja pobierania danych, obsługa zmiany frazy wyszukiwania.
- **Typy:** Brak propsów (top-level component).
- **Zarządzanie stanem:** Używa hooka `useSavedItems`.

### `SavedItemsHeader`
- **Opis:** Nagłówek sekcji zawierający tytuł oraz pasek wyszukiwania.
- **Główne elementy:** `h1`, `SearchBar`.
- **Props:**
  - `onSearch: (query: string) => void`
  - `isSearching: boolean`

### `SearchBar`
- **Opis:** Komponent wejściowy z opóźnieniem (debounce) do filtrowania listy.
- **Główne elementy:** `Input` (Shadcn UI), ikona lupy.
- **Obsługiwane interakcje:** Wpisanie tekstu -> `debounce` -> wywołanie `onSearch`.
- **Props:**
  - `onSearch: (query: string) => void`
  - `placeholder: string`

### `SavedItemsList`
- **Opis:** Lista renderująca karty zapisanych elementów oraz element obserwujący przewijanie.
- **Główne elementy:** `div` (grid/list layout), lista `SavedItemCard`.
- **Props:**
  - `items: SavedItemWithAnalysisDTO[]`
  - `isLoadingMore: boolean`
  - `hasMore: boolean`
  - `onLoadMore: () => void`
  - `onDelete: (id: string) => Promise<void>`

### `SavedItemCard`
- **Opis:** Karta prezentująca pojedyncze zapisane zdanie. Kliknięcie w kartę (poza przyciskiem usuwania) przenosi do widoku analizy.
- **Główne elementy:** `Card` (Shadcn UI), `Typography` (tekst japoński, tłumaczenie), `Button` (usuwanie).
- **Obsługiwane interakcje:**
  - Kliknięcie w kartę -> nawigacja do `/analyses/[id]`.
  - Kliknięcie w "Usuń" -> wywołanie `onDelete` (zatrzymanie propagacji).
- **Props:**
  - `item: SavedItemWithAnalysisDTO`
  - `onDelete: (id: string) => void`

### `EmptyState`
- **Opis:** Wyświetlany, gdy lista jest pusta (brak wyników wyszukiwania lub brak zapisanych elementów).
- **Główne elementy:** Ikona, komunikat tekstowy, opcjonalnie przycisk "Analizuj nowe zdanie".

## 5. Typy

Wykorzystujemy istniejące typy z `src/types.ts`:

- **`SavedItemWithAnalysisDTO`**: Główny model danych dla elementu listy.
  - `savedItemId`: string
  - `savedAt`: string (ISO date)
  - `analysis`: AnalysisDTO (zawiera `originalText`, `translation`)

- **`SavedItemsQueryParams`**: Do budowania zapytań API.
  - `q`: string
  - `page`: number
  - `pageSize`: number

## 6. Zarządzanie stanem

Zalecane jest stworzenie custom hooka `useSavedItems` w `src/lib/hooks/useSavedItems.ts`.

**Stan w hooku:**
- `items`: `SavedItemWithAnalysisDTO[]` - zakumulowana lista elementów.
- `page`: `number` - obecna strona (start: 1).
- `hasMore`: `boolean` - czy są kolejne strony.
- `isLoading`: `boolean` - stan ładowania (pierwsze wejście).
- `isFetchingNextPage`: `boolean` - stan dociągania kolejnych stron.
- `searchQuery`: `string` - aktualna fraza wyszukiwania.

**Logika:**
- Zmiana `searchQuery` resetuje `items` do `[]` i `page` do `1`.
- Funkcja `loadMore` inkrementuje `page`.
- Funkcja `deleteItem` optymistycznie usuwa element z lokalnego stanu `items`.

## 7. Integracja API

**Endpoint:** `GET /api/saved-items`

**Parametry zapytania:**
- `page`: numer strony (z hooka).
- `pageSize`: stała (np. 20).
- `q`: fraza wyszukiwania (z hooka).
- `sort`: `savedAt` (domyślnie).
- `order`: `desc` (domyślnie).

**Obsługa odpowiedzi (`PaginatedSavedItemsDTO`):**
- Jeśli `page === 1`, nadpisz stan `items`.
- Jeśli `page > 1`, dołącz nowe elementy do `items`.
- Ustaw `hasMore` na podstawie `total > items.length`.

**Usuwanie:** `DELETE /api/saved-items/[id]`
- Po sukcesie (204) lub optymistycznie: usuń element z tablicy w stanie.

## 8. Interakcje użytkownika

1.  **Wejście na stronę:** Ładowanie pierwszej partii danych (szkielety kart).
2.  **Przewijanie w dół:** Gdy użytkownik zbliży się do końca listy, automatycznie ładowana jest kolejna strona (Infinite Scroll).
3.  **Wyszukiwanie:** Wpisanie frazy filtruje listę. Lista przewija się na górę.
4.  **Kliknięcie w element:** Przejście do szczegółów analizy.
5.  **Usunięcie elementu:** Kliknięcie ikony kosza -> potwierdzenie (opcjonalne) -> usunięcie elementu z listy bez przeładowania strony.

## 9. Warunki i walidacja

- **Autentykacja:** Sprawdzana po stronie serwera (Astro middleware lub w nagłówku `.astro`). API zwraca 401 dla niezalogowanych.
- **Puste wyniki:** Jeśli API zwróci pustą tablicę `items`:
  - Przy wyszukiwaniu: Pokaż "Brak wyników dla frazy...".
  - Bez wyszukiwania: Pokaż "Nie masz jeszcze zapisanych zdań".
- **Koniec listy:** Ukryj loader, gdy `hasMore === false`.

## 10. Obsługa błędów

- **Błąd ładowania listy:** Wyświetlenie komunikatu błędu z przyciskiem "Spróbuj ponownie".
- **Błąd usuwania:** Jeśli optymistyczne usunięcie się nie powiedzie, przywróć element na listę i wyświetl `toast` z błędem.
- **Błąd 401:** Przekierowanie do logowania.

## 11. Kroki implementacji

1.  **Przygotowanie API Clienta:** Upewnij się, że istnieje funkcja pomocnicza do zapytań (np. `fetchJson`) obsługująca parametry URL.
2.  **Stworzenie Hooka `useSavedItems`:** Zaimplementuj logikę pobierania, paginacji i wyszukiwania.
3.  **Implementacja `SavedItemCard`:** Stwórz komponent wizualny karty z użyciem Shadcn/ui. Pamiętaj o formatowaniu daty (`Intl.RelativeTimeFormat`).
4.  **Implementacja `SavedItemsList`:** Złóż listę i dodaj `IntersectionObserver` dla infinite scroll.
5.  **Implementacja `SearchBar`:** Dodaj input z debounce.
6.  **Złożenie `SavedItemsView`:** Połącz komponenty i hooka.
7.  **Strona Astro:** Utwórz `src/pages/saved/index.astro`, dodaj sprawdzenie sesji i wyrenderuj widok.
8.  **Testy manualne:** Sprawdź ładowanie, przewijanie, wyszukiwanie i usuwanie.
