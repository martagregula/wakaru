# Plan implementacji widoku szczegółów zapisanej analizy

## 1. Przegląd
Widok szczegółów zapisanej analizy (`SavedAnalysisView`) pozwala zalogowanym użytkownikom przeglądać pełne wyniki analizy (tokeny, morfologia, tłumaczenie) dla zdań, które wcześniej zapisali w swojej bibliotece. Widok ten jest wizualnie spójny z ekranem wyników nowej analizy, ale oferuje inny zestaw akcji (np. usuwanie zamiast zapisywania).

## 2. Routing widoku
*   **Ścieżka:** `/analysis/[id]`
*   **Parametr:** `id` - identyfikator UUID analizy.
*   **Dostęp:** Widok chroniony (wymaga zalogowania).

## 3. Struktura komponentów

```text
src/pages/analysis/[id].astro (Page)
└── SavedAnalysisFeature (Container)
    ├── Skeleton (Loading State)
    ├── ErrorState (Error UI)
    └── SavedAnalysisView (Presentational)
        ├── Card (UI Container)
        │   ├── Header (Difficulty & Romaji info)
        │   ├── TokenGrid (Existing Component)
        │   ├── TranslationBlock (Existing Component)
        │   └── SavedAnalysisActions (New Component)
        │       ├── Button (Copy Translation)
        │       └── Button (Delete/Remove)
```

## 4. Szczegóły komponentów

### `src/pages/analysis/[id].astro`
*   **Opis:** Strona Astro obsługująca routing i wstępne pobranie ID. Renderuje kontener Reactowy tylko po stronie klienta (`client:only="react"` lub `client:load`).
*   **Główne elementy:** `SavedAnalysisFeature`.
*   **Obsługiwana walidacja:** Sprawdzenie obecności parametru `id`.

### `SavedAnalysisFeature` (`src/components/features/analysis/SavedAnalysisFeature.tsx`)
*   **Opis:** Komponent-kontener ("Smart Component"). Odpowiada za pobranie danych z API, zarządzanie stanem (ładowanie, błędy) i logikę usuwania.
*   **Stan:** `analysis`, `loading`, `error`, `isDeleting`.
*   **Logika:**
    *   `useEffect` do pobrania danych z `GET /api/analyses/[id]`.
    *   Funkcja `handleDelete` wykonująca żądanie do API i przekierowująca użytkownika.
*   **Zależności:** `useToast`, `useRouter` (lub `window.location`).

### `SavedAnalysisView` (`src/components/features/analysis/SavedAnalysisView.tsx`)
*   **Opis:** Komponent prezentacyjny ("Dumb Component"). Odpowiada za wyświetlenie danych analizy w układzie identycznym jak `AnalysisResult`.
*   **Główne elementy:**
    *   `Card`, `CardHeader`, `CardContent` (z `shadcn/ui`).
    *   Siatka (Grid) z informacjami o poziomie trudności i Romaji.
    *   `TokenGrid` (reużycie z `src/components/features/analysis/TokenGrid.tsx`).
    *   `TranslationBlock` (reużycie z `src/components/features/analysis/TranslationBlock.tsx`).
    *   `SavedAnalysisActions`.
*   **Propsy:**
    *   `analysis: AnalysisDTO`
    *   `onDelete: () => void`
    *   `onCopy: () => void`
    *   `isDeleting: boolean`

### `SavedAnalysisActions` (`src/components/features/analysis/SavedAnalysisActions.tsx`)
*   **Opis:** Pasek akcji dostępnych dla zapisanej analizy.
*   **Główne elementy:**
    *   `Button` (wariant `outline` dla Kopiuj).
    *   `Button` (wariant `destructive` lub `ghost` dla Usuń).
*   **Propsy:**
    *   `onDelete: () => void`
    *   `onCopy: () => void`
    *   `isDeleting: boolean`
    *   `translation: string | null`

## 5. Typy

Wykorzystujemy istniejące typy z `@/types`, w szczególności `AnalysisDTO`.
Może być konieczne zdefiniowanie typu odpowiedzi, jeśli API go nie eksportuje:

```typescript
// W pliku komponentu lub types.ts jeśli współdzielone
interface AnalysisResponse {
  analysis: AnalysisDTO;
  // Opcjonalnie: savedItemId jeśli backend zostanie zaktualizowany
}
```

## 6. Zarządzanie stanem

Zarządzanie stanem odbywa się lokalnie w komponencie `SavedAnalysisFeature`:

*   **Pobieranie danych:** `isLoading` (bool), `data` (AnalysisDTO | null), `error` (string | null).
*   **Operacje:** `isDeleting` (bool) do obsługi stanu loading na przycisku usuwania.
*   **Custom Hooks:** Można rozważyć stworzenie `useAnalysis(id)` jeśli ta logika będzie potrzebna w innych miejscach, ale na ten moment wystarczy logika wewnątrz komponentu lub użycie generycznego `fetchJson`.

## 7. Integracja API

### Pobieranie analizy
*   **Endpoint:** `GET /api/analyses/:id`
*   **Metoda:** `GET`
*   **Typ odpowiedzi:** `{ analysis: AnalysisDTO }`
*   **Obsługa błędów:**
    *   `401 Unauthorized`: Przekierowanie do `/login`.
    *   `404 Not Found`: Wyświetlenie komunikatu "Analiza nie została znaleziona lub nie masz do niej dostępu".

### Usuwanie z biblioteki
*   **Wyzwanie:** Endpoint `DELETE /api/saved-items/:id` wymaga ID zapisanego elementu (`savedItemId`), a endpoint `GET /api/analyses/:id` zwraca obecnie tylko `AnalysisDTO`.
*   **Rozwiązanie:** Należy zaktualizować backend, aby `GET /api/analyses/:id` zwracał również `savedItemId` dla zapisanych elementów LUB umożliwić usuwanie po `analysisId`.
*   **Założenie dla planu:** Przyjmujemy, że frontend wywoła `DELETE /api/saved-items?analysisId=[id]` lub backend zostanie dostosowany.

## 8. Interakcje użytkownika

1.  **Wejście na stronę:** Wyświetlenie szkieletu ładowania (Skeleton), następnie właściwej treści.
2.  **Kopiowanie tłumaczenia:** Kliknięcie "Kopiuj tłumaczenie" -> skopiowanie tekstu do schowka -> wyświetlenie toasta "Skopiowano".
3.  **Usuwanie:** Kliknięcie "Usuń" -> (opcjonalnie modal potwierdzenia) -> zmiana stanu przycisku na loading -> wywołanie API -> w przypadku sukcesu toast "Usunięto" i przekierowanie do listy zapisanych (`/saved`).
4.  **Błąd ładowania:** Wyświetlenie komunikatu błędu z przyciskiem "Spróbuj ponownie".

## 9. Warunki i walidacja

*   **ID:** Parametr `id` w URL musi być poprawnym UUID (walidacja po stronie API, frontend obsługuje 404/400).
*   **Auth:** Użytkownik musi być zalogowany (weryfikowane przez API, frontend obsługuje 401).
*   **Własność:** Użytkownik musi być właścicielem zapisanego elementu (weryfikowane przez API).

## 10. Obsługa błędów

*   **Błędy sieciowe/API:** Wyświetlenie alertu/komunikatu w miejscu treści (nie tylko toast).
*   **Brak analizy (404):** Specjalny widok "Empty State" lub informacja o braku dostępu.
*   **Błąd usuwania:** Toast z wariantem `destructive` informujący o niepowodzeniu.

## 11. Kroki implementacji

1.  **Stworzenie komponentów UI:**
    *   Stwórz `SavedAnalysisActions.tsx` w `src/components/features/analysis`.
    *   Stwórz `SavedAnalysisView.tsx` wykorzystując `TokenGrid` i `TranslationBlock`.
2.  **Implementacja Feature Component:**
    *   Stwórz `SavedAnalysisFeature.tsx`.
    *   Zaimplementuj pobieranie danych używając `fetchJson`.
    *   Obsłuż stany ładowania i błędów.
3.  **Integracja akcji:**
    *   Zaimplementuj logikę `handleCopy`.
    *   Zaimplementuj logikę `handleDelete` (z uwzględnieniem komunikacji z API).
4.  **Stworzenie strony Astro:**
    *   Stwórz plik `src/pages/analysis/[id].astro`.
    *   Zaimportuj i wyrenderuj `SavedAnalysisFeature` (pamiętaj o `client:only` lub `client:load`).
5.  **Weryfikacja:**
    *   Sprawdź działanie dla istniejącej analizy.
    *   Sprawdź zachowanie dla błędnego ID (404).
    *   Sprawdź zachowanie dla niezalogowanego użytkownika (401).
