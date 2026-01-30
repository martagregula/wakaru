# Plan implementacji widoku Analizy (Home)

## 1. Przegląd

Widok Analizy jest główną stroną aplikacji (`/`), służącą do wprowadzania japońskiego tekstu i otrzymywania jego analizy morfologicznej. Dla użytkowników niezalogowanych pełni funkcję demonstracyjną (z wymuszeniem logowania przy próbie analizy), a dla zalogowanych jest głównym narzędziem pracy, pozwalającym na analizę, podgląd szczegółów gramatycznych oraz zapisywanie wyników do biblioteki.

## 2. Routing widoku

- **Ścieżka:** `/` (Root)
- **Plik Astro:** `src/pages/index.astro`

## 3. Struktura komponentów

Widok zostanie zbudowany w oparciu o architekturę "Islands Architecture" (Astro + React), gdzie główna interaktywność jest zamknięta w kontenerze React.

```
src/pages/index.astro (Astro Page)
└── Layout.astro (Main Layout)
    └── AnalysisFeature.tsx (React Container - client:load)
        ├── AnalysisInput.tsx (Formularz wejściowy)
        └── AnalysisResult.tsx (Kontener wyników - warunkowy)
            ├── TokenGrid.tsx (Siatka tokenów)
            │   └── TokenCard.tsx (Pojedynczy token z Popoverem)
            │       └── TokenDetail.tsx (Treść szczegółów)
            ├── TranslationBlock.tsx (Tłumaczenie całego zdania)
            └── AnalysisActions.tsx (Pasek narzędzi: Zapisz, Kopiuj)
```

## 4. Szczegóły komponentów

### AnalysisFeature (Container)

- **Opis:** Główny komponent zarządzający stanem widoku. Odpowiada za komunikację z API i koordynację podkomponentów.
- **Główne elementy:** Wrapper `div`, wewnątrz `AnalysisInput` oraz warunkowo `AnalysisResult` (lub Skeleton podczas ładowania).
- **Obsługiwane interakcje:** Przekazywanie zdarzeń z `AnalysisInput` (onChange, onSubmit) i `AnalysisResult` (onSave, onCopy); wywołania API w odpowiedzi na akcje użytkownika.
- **Obsługiwana walidacja:** Blokada wywołania API analizy, gdy użytkownik niezalogowany (`!isLoggedIn`); przekazywanie błędów walidacji z inputu.
- **Typy:** `AnalysisDTO`, `CreateAnalysisCommand`, `SaveItemCommand`, `SaveStatus` (idle | saving | saved | error).
- **Propsy:** `isLoggedIn: boolean` (przekazane z Astro na podstawie sesji).

### AnalysisInput

- **Opis:** Pole tekstowe do wprowadzania zdania japońskiego z licznikiem znaków i przyciskiem analizy.
- **Główne elementy:** `Textarea` (Shadcn), licznik znaków (np. `12/280`), przycisk "Analizuj", opcjonalny komunikat błędu walidacji.
- **Obsługiwane interakcje:** `onChange` (aktualizacja wartości i licznika), `onSubmit` (kliknięcie przycisku lub skrót klawiaturowy).
- **Obsługiwana walidacja:** Tekst niepusty; max 280 znaków; wykrywanie znaków japońskich (regex). Wyświetlenie błędu pod polem, gdy brak japońskich znaków lub przekroczony limit.
- **Typy:** Wykorzystuje `string` dla wartości; walidacja zgodna z API (min 1, max 280 + japoński).
- **Propsy:** `value: string`, `onChange: (value: string) => void`, `onSubmit: () => void`, `isLoading: boolean`, `error: string | null`, `disabled?: boolean` (np. gdy niezalogowany).

### AnalysisResult

- **Opis:** Komponent prezentacyjny wyświetlający wyniki analizy: siatkę tokenów, tłumaczenie i pasek akcji.
- **Główne elementy:** Wrapper `div`, `TokenGrid`, `TranslationBlock`, `AnalysisActions`.
- **Obsługiwane interakcje:** Przekazywanie zdarzeń do zapisu i kopiowania do kontenera.
- **Obsługiwana walidacja:** Brak walidacji wejścia; wyświetla dane z `AnalysisDTO`.
- **Typy:** `AnalysisDTO`.
- **Propsy:** `analysis: AnalysisDTO`, `onSave: () => Promise<void>`, `isSaving: boolean`, `isSaved: boolean`.

### TokenGrid

- **Opis:** Kontener układu (flex/grid) wyświetlający listę tokenów w formie kafelków.
- **Główne elementy:** Wrapper `div` z klasami układu, mapowanie `tokens` na komponenty `TokenCard`.
- **Obsługiwane interakcje:** Brak bezpośrednich zdarzeń; interakcja odbywa się w `TokenCard`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `TokenDTO[]`.
- **Propsy:** `tokens: TokenDTO[]`.

### TokenCard

- **Opis:** Pojedynczy kafelek reprezentujący token; kliknięcie otwiera Popover ze szczegółami.
- **Główne elementy:** Przycisk lub `div` z `Popover` (Shadcn/Radix), wewnątrz trigger z `token.surface`, treść Popovera to `TokenDetail`.
- **Obsługiwane interakcje:** Kliknięcie (lub dotknięcie) otwiera/zamyka Popover.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `TokenDTO`, `PartOfSpeech` (do kolorowania).
- **Propsy:** `token: TokenDTO`. Opcjonalnie funkcja `getPosColor(pos: PartOfSpeech): string` lub mapa kolorów.

### TokenDetail

- **Opis:** Zawartość Popovera wyświetlająca szczegóły morfologiczne tokenu.
- **Główne elementy:** Lista pól: oryginalna forma (`surface`), forma słownikowa (`dictionaryForm`), część mowy (`pos`), czytanie (`reading`), definicja (`definition`).
- **Obsługiwane interakcje:** Brak (tylko prezentacja).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `TokenDTO`.
- **Propsy:** `token: TokenDTO`.

### TranslationBlock

- **Opis:** Blok wyświetlający pełne tłumaczenie zdania z analizy.
- **Główne elementy:** Etykieta "Tłumaczenie" (lub odpowiednik), paragraf z `analysis.translation`.
- **Obsługiwane interakcje:** Brak (kopiowanie obsługiwane w `AnalysisActions`).
- **Obsługiwana walidacja:** Brak; obsługa `translation === null` (np. wyświetlenie "—" lub ukrycie).
- **Typy:** `string | null`.
- **Propsy:** `translation: string | null`.

### AnalysisActions

- **Opis:** Pasek akcji pod wynikami: przycisk "Zapisz" i "Kopiuj tłumaczenie".
- **Główne elementy:** Dwa przyciski (Shadcn Button); stan "Zapisano" po udanym zapisie (np. ikona + tekst).
- **Obsługiwane interakcje:** Kliknięcie "Zapisz" wywołuje `onSave`; kliknięcie "Kopiuj" kopiuje tłumaczenie do schowka i wyświetla toast.
- **Obsługiwana walidacja:** Przycisk "Zapisz" wyłączony, gdy `isSaved === true` lub `isSaving === true`.
- **Typy:** Brak dodatkowych DTO.
- **Propsy:** `onSave: () => void`, `onCopyTranslation: () => void`, `isSaving: boolean`, `isSaved: boolean`, `translation: string | null` (do kopiowania).

## 5. Typy

Wykorzystanie istniejących typów z `src/types.ts`:

- **`AnalysisDTO`:** `id`, `originalText`, `translation`, `data` (`difficulty`, `romaji`, `tokens`), `createdAt`.
- **`TokenDTO`:** `surface`, `dictionaryForm`, `pos`, `reading`, `definition`.
- **`PartOfSpeech`:** union literałów (Noun, Verb, Particle, itd.).
- **`CreateAnalysisCommand`:** `{ originalText: string }`.
- **`SaveItemCommand`:** `{ analysisId: string }`.
- **`CreateAnalysisResponseDTO`:** `{ analysis: AnalysisDTO, deduplicated: boolean }`.
- **`CreateSavedItemResponseDTO`:** `{ savedItem: SavedItemDTO }`.

Pomocnicze typy widoku:

```ts
type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AnalysisFeatureProps {
  isLoggedIn: boolean;
}
```

Opcjonalnie: funkcja lub mapa `getPosColor(pos: PartOfSpeech): string` do spójnego kolorowania kafelków (np. w `lib/utils/pos-colors.ts`).

## 6. Zarządzanie stanem

Stan zarządzany jest lokalnie w `AnalysisFeature` przy użyciu `useState`:

- **`inputText`** (string): wartość pola tekstowego.
- **`analysis`** (`AnalysisDTO | null`): wynik analizy; `null` przed pierwszą analizą lub po wyczyszczeniu.
- **`isLoading`** (boolean): oczekiwanie na odpowiedź `POST /api/analyses`.
- **`validationError`** (`string | null`): błąd walidacji frontendowej (np. brak japońskich znaków).
- **`saveStatus`** (`SaveStatus`): stan operacji zapisu (`idle` | `saving` | `saved` | `error`).

Do powiadomień użytkownika (sukces zapisu, błąd, skopiowano) użyć hooka **`useToast`** z Shadcn UI (lub ekwiwalentu). Nie jest wymagany zewnętrzny store (np. Zustand); ewentualnie kontekst sesji tylko do odczytu `isLoggedIn` przekazany z Astro.

## 7. Integracja API

### Analiza tekstu

- **Endpoint:** `POST /api/analyses`
- **Request:** `CreateAnalysisCommand` — body: `{ originalText: string }` (trim, max 280 znaków).
- **Response:** `CreateAnalysisResponseDTO` — `{ analysis: AnalysisDTO, deduplicated: boolean }`.
- **Sukces:** 200 (istniejąca analiza) lub 201 (nowa). Ustawienie stanu `analysis` na `response.analysis`, wyzerowanie `validationError`.
- **Błędy:** 400 (walidacja), 401 (brak auth), 429 (rate limit), 500. Parsowanie JSON body błędu (`error`, `message`) i ustawienie komunikatu (toast + ewentualnie `validationError`).

### Zapisywanie do biblioteki

- **Endpoint:** `POST /api/saved-items`
- **Request:** `SaveItemCommand` — body: `{ analysisId: string }` (UUID bieżącej analizy).
- **Response:** `CreateSavedItemResponseDTO` — `{ savedItem: SavedItemDTO }`.
- **Sukces:** 201. Ustawienie `saveStatus` na `saved`, toast „Zapisano w bibliotece”.
- **Błędy:** 400 (nieprawidłowy payload), 401 (wymagane logowanie), 404 (analiza nie istnieje), 409 (już zapisane). Dla 409 toast „Ta analiza jest już w bibliotece”; dla 401 przekierowanie lub modal logowania.

## 8. Interakcje użytkownika

1. **Wprowadzanie tekstu:** Użytkownik wpisuje tekst w textarea. Licznik znaków aktualizuje się na żywo (np. `n/280`). Przy przekroczeniu 280 znaków blokada wysłania i komunikat błędu.
2. **Kliknięcie „Analizuj” (gość):** Sprawdzenie `isLoggedIn`. Jeśli `false` — wyświetlenie modala/komunikatu „Zaloguj się, aby analizować” (bez wywołania API).
3. **Kliknięcie „Analizuj” (zalogowany):** Walidacja: niepusty tekst, znaki japońskie, ≤280 znaków. W razie błędu — komunikat pod polem. W razie sukcesu — request do API, wskaźnik ładowania (Skeleton), po odpowiedzi — wyświetlenie `AnalysisResult`.
4. **Kliknięcie w token:** Otwarcie Popovera z `TokenDetail` (forma oryginalna, słownikowa, POS, czytanie, definicja). Zamknięcie przez kliknięcie poza lub ponowne kliknięcie.
5. **Kliknięcie „Zapisz”:** Request do `POST /api/saved-items` z `analysisId`. Podczas wysyłki przycisk nieaktywny; po 201 — stan „Zapisano”, toast. Przy 409 — toast „Już zapisane”.
6. **Kliknięcie „Kopiuj tłumaczenie”:** Skopiowanie `analysis.translation` do schowka (`navigator.clipboard.writeText`), toast „Skopiowano”.

## 9. Warunki i walidacja

- **Pole tekstowe (AnalysisInput):**
  - Tekst niepusty po trim: `value.trim().length > 0`.
  - Długość: `value.length <= 280` (zgodne z API).
  - Obecność znaków japońskich: regex np. `/[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/`.test(value). Gdy brak — komunikat „Wprowadź tekst zawierający znaki japońskie” (lub ekwiwalent).
- **Kontener (AnalysisFeature):** Przed wywołaniem `POST /api/analyses` sprawdzenie `isLoggedIn === true`; w przeciwnym razie tylko pokazanie modala/komunikatu, bez requestu.
- **Przycisk Zapisz:** Widoczny/aktywny tylko gdy jest wynik analizy i użytkownik zalogowany; po zapisaniu (`isSaved`) przycisk nieaktywny lub w stanie „Zapisano”.

## 10. Obsługa błędów

- **Walidacja inputu:** Komunikat tekstowy pod textarea (`validationError`), bez blokowania dalszego edytowania.
- **401 (Analiza):** Toast „Zaloguj się, aby analizować” i/lub przekierowanie do logowania. Stan `analysis` bez zmian.
- **401 (Zapis):** Toast „Zaloguj się, aby zapisać”; ewentualnie odświeżenie sesji.
- **400 (Analiza):** Wyświetlenie `message` z odpowiedzi w toastcie lub pod polem (np. „Text cannot exceed 280 characters”).
- **404 (Zapis):** Toast „Nie znaleziono analizy”.
- **409 (Zapis):** Toast „Ta analiza jest już w Twojej bibliotece”; ustawienie `saveStatus` na `saved`, aby przycisk pokazywał stan „Zapisano”.
- **429 (Rate limit):** Toast „Zbyt wiele żądań. Spróbuj ponownie za chwilę.”
- **500 / błąd sieci:** Toast „Coś poszło nie tak. Spróbuj ponownie.”; zachowanie poprzedniego stanu wyników.

Wszystkie błędy API parsować z body odpowiedzi (pole `message` lub `error`), z fallbackiem na ogólny komunikat.

## 11. Kroki implementacji

1. Dodać brakujące komponenty Shadcn (Textarea, Card, Popover, Skeleton, Toast) do projektu, jeśli ich jeszcze nie ma.
2. Utworzyć katalog `src/components/features/analysis` i pliki dla komponentów: `AnalysisFeature.tsx`, `AnalysisInput.tsx`, `AnalysisResult.tsx`, `TokenGrid.tsx`, `TokenCard.tsx`, `TokenDetail.tsx`, `TranslationBlock.tsx`, `AnalysisActions.tsx`.
3. Zaimplementować `AnalysisInput`: textarea z licznikiem, walidacja (długość, znaki japońskie), przycisk „Analizuj”, wyświetlanie `error`.
4. Zaimplementować szkielet `AnalysisFeature`: stan (`inputText`, `analysis`, `isLoading`, `validationError`, `saveStatus`), osadzenie `AnalysisInput`, warunkowe wyświetlanie Skeleton (gdy `isLoading`) i `AnalysisResult` (gdy `analysis !== null`).
5. Podłączyć `AnalysisFeature` w `src/pages/index.astro` z użyciem `client:load`; przekazać `isLoggedIn` z `Astro.locals` (lub placeholder `false`, dopóki auth nie jest zaimplementowane).
6. Zaimplementować wywołanie `POST /api/analyses` w `AnalysisFeature` (funkcja `analyzeText`), obsługę 200/201 i błędów (400, 401, 429, 500), ustawianie `analysis` i `validationError`.
7. Zaimplementować `TokenCard` i `TokenGrid`: wyświetlanie `token.surface`, Popover z `TokenDetail`; dodać mapę kolorów dla `PartOfSpeech` (np. w `lib/utils/pos-colors.ts`) i stylizację kafelka.
8. Zaimplementować `TokenDetail`: wyświetlanie `surface`, `dictionaryForm`, `pos`, `reading`, `definition`.
9. Zaimplementować `TranslationBlock` i `AnalysisActions`: wyświetlanie tłumaczenia, przyciski Zapisz i Kopiuj; w `AnalysisFeature` — obsługa `POST /api/saved-items` (onSave), kopiowanie do schowka (onCopyTranslation), toasty.
10. Dodać logikę gościa: przed wywołaniem analizy sprawdzenie `isLoggedIn`; gdy `false`, pokazać toast lub modal „Zaloguj się, aby analizować” zamiast requestu.
11. Przeprowadzić testy manualne: użytkownik zalogowany (analiza, zapis, kopiowanie, kliknięcie w token); użytkownik gość (próba analizy → komunikat); walidacja (pusty tekst, >280 znaków, brak japońskiego); obsługa błędów API (np. 409 przy ponownym zapisie).
