# Architektura UI dla Wakaru

## 1. Przegląd struktury UI

Architektura interfejsu Wakaru opiera się na modelu **Server-Side Rendering (SSR)** w Astro 5, z interaktywnymi „wyspami” React 19 w miejscach wymagających dynamiki: formularz analizy, wyniki z tokenami, lista zapisanych zdań, modale uwierzytelniania. Stylizacja realizowana jest za pomocą Tailwind 4 i komponentów Shadcn/ui (opartych na Radix UI). MVP jest ukierunkowane na **wersję Desktop**; nawigacja odbywa się przez **górny pasek (Topbar)** z logo, linkami i akcjami konta. Widok **Analiza** pełni rolę strony głównej (Home); widok **Moje Zdania** (Biblioteka) jest dostępny wyłącznie dla użytkowników zalogowanych. Dane pobierane i aktualizowane są z globalnym powiadomieniem błędów (Toaster). Tryb jasny/ciemny obsługiwany jest przez next-themes.

---

## 2. Lista widoków

### 2.1. Widok Analizy (Strona główna)

| Aspekt | Opis |
|--------|------|
| **Nazwa** | Widok Analizy (Home) |
| **Ścieżka** | `/` |
| **Główny cel** | Umożliwienie przeglądania przykładów (gość) lub wprowadzenia tekstu japońskiego i wyświetlenia analizy (zalogowany); prezentacja wyników w formie interaktywnych tokenów i tłumaczenia. |
| **Kluczowe informacje** | Dla zalogowanego: pole tekstowe (max 280 znaków), licznik znaków, po analizie — siatka tokenów z kolorami POS, tłumaczenie zdania, stan zapisu (zapisane/niezapisane). |
| **Kluczowe komponenty** | Layout z Topbarem, Textarea z walidacją i licznikiem, przycisk analizy, sekcja wyników: grid tokenów (każdy token z Popoverem), blok tłumaczenia, pasek akcji (Zapisz, Kopiuj), Skeleton w stanie ładowania. |
| **UX, a11y, bezpieczeństwo** | Układ wertykalny: pole na górze, wyniki poniżej. Walidacja po stronie klienta — blokada wysłania przy braku znaków japońskich. Stany ładowania przez Skeleton zamiast spinnerów. Tokeny z wyraźnym focusem i obsługą klawiatury (Radix Popover). Gość widzi input; próba analizy wyzwala modal logowania (konwersja gościa). |

---

### 2.2. Widok pojedynczej analizy (z Biblioteki lub przykładu)

| Aspekt | Opis |
|--------|------|
| **Nazwa** | Widok pojedynczej analizy |
| **Ścieżka** | `/analysis/[id]` (lub ekwiwalent z parametrem zapytania) |
| **Główny cel** | Wyświetlenie pełnego wyniku analizy po kliknięciu w element z listy „Moje Zdania” lub w przykład na stronie głównej — bez ponownego wywołania API AI. |
| **Kluczowe informacje** | Oryginalny tekst, tokeny z kolorami POS, tłumaczenie, opcjonalnie data zapisu/utworzenia; dla zapisanych — pasek akcji (np. Usuń z biblioteki, Kopiuj). |
| **Kluczowe komponenty** | Ten sam zestaw co w widoku Analizy dla „wyników”: grid tokenów z Popoverami, blok tłumaczenia, pasek akcji; brak pola input. Dane z `GET /api/analyses/:id`. Opcjonalnie breadcrumb / link powrotu do Biblioteki lub Home. |
| **UX, a11y, bezpieczeństwo** | Spójna prezentacja z widokiem Analizy. Ładowanie pojedynczego rekordu z API; Skeleton do czasu załadowania. Dostęp tylko do analiz należących do użytkownika (zgodnie z API). |

---

### 2.3. Widok Biblioteki (Moje Zdania)

| Aspekt | Opis |
|--------|------|
| **Nazwa** | Widok Biblioteki (Moje Zdania) |
| **Ścieżka** | `/saved` |
| **Główny cel** | Przeglądanie listy zapisanych analiz użytkownika, wyszukiwanie w nich oraz przejście do pełnego widoku analizy. |
| **Kluczowe informacje** | Lista elementów: fragment tekstu japońskiego (font Noto Sans JP, większy), tłumaczenie, data zapisu w formacie relatywnym (Intl.RelativeTimeFormat). Paginacja przez Infinite Scroll. Pasek wyszukiwania w nagłówku sekcji. |
| **Kluczowe komponenty** | Layout z Topbarem, nagłówek z polem wyszukiwania, lista kart/rzędów (`GET /api/saved-items` z parametrem `q`, Infinite Scroll), przycisk/usuwanie z biblioteki w karcie (opcjonalnie), Empty State gdy brak zapisanych zdań, Skeleton dla ładowania kolejnych stron. |
| **UX, a11y, bezpieczeństwo** | Infinite Scroll. Empty State z zachętą do pierwszej analizy i zapisu. Trasa chroniona: brak sesji → przekierowanie lub pokazanie zachęty do logowania. Dane tylko zalogowanego użytkownika (API 401). |

---

### 2.4. Modale uwierzytelniania

| Aspekt | Opis |
|--------|------|
| **Nazwa** | Modal logowania / Modal rejestracji |
| **Ścieżka** | Overlay na bieżącej stronie (brak dedykowanej ścieżki). |
| **Główny cel** | Logowanie i rejestracja bez opuszczania bieżącego widoku (zachowanie kontekstu). |
| **Kluczowe informacje** | Logowanie: pola email i hasło, przycisk „Zaloguj”, link do rejestracji (otwiera modal rejestracji). Rejestracja: email, hasło, przycisk „Zarejestruj”, link do logowania. Komunikaty błędów (np. nieprawidłowe dane, błąd sieci). |
| **Kluczowe komponenty** | Dialog (Shadcn) dla obu modali, formularze z walidacją (format email, wymagania hasła), obsługa Supabase Auth. Przełączanie między modalami bez przeładowania strony. |
| **UX, a11y, bezpieczeństwo** | Focus trap i zamykanie Escape (Radix Dialog). Nie przechowujemy wrażliwych danych w LocalStorage. Po udanej rejestracji użytkownik jest od razu zalogowany. Sesja utrzymywana po odświeżeniu. |

---

### 2.5. Globalny layout (Shell)

| Aspekt | Opis |
|--------|------|
| **Nazwa** | Globalny layout z Topbarem |
| **Ścieżka** | Otacza wszystkie strony. |
| **Główny cel** | Spójna nawigacja, przełącznik motywu, akcje konta (zaloguj / avatar z menu). |
| **Kluczowe informacje** | Logo, link „Przykłady” (lub „Analiza”) do `/`, link „Zapisane” do `/saved` (widoczny dla zalogowanych), przełącznik jasny/ciemny, dla niezalogowanych: przycisk „Zaloguj”; dla zalogowanych: avatar z inicjałami na kolorowym tle i menu (np. Moje Zdania, Wyloguj). |
| **Kluczowe komponenty** | Sticky Topbar, nawigacja (linki), ThemeToggle (next-themes), przycisk Zaloguj, Avatar + DropdownMenu (Shadcn). |
| **UX, a11y, bezpieczeństwo** | Sticky header — zawsze dostępna nawigacja. Avatar bez wgrywania pliku (MVP): inicjały na tle. Menu z wyraźnymi etykietami i obsługą klawiatury. |

---

## 3. Mapa podróży użytkownika

- **Gość na stronie głównej (`/`)**  
  Widzi pole tekstowe. Próba uruchomienia analizy własnego tekstu → otwiera się modal logowania (konwersja gościa). Z Topbara może kliknąć „Zaloguj” lub „Zarejestruj” → modale bez zmiany strony.

- **Rejestracja / logowanie**  
  Wypełnienie formularza w modalu → sukces → modal się zamyka, użytkownik zalogowany; Topbar pokazuje avatar i „Zapisane”. Błąd → komunikat w modalu.

- **Zalogowany użytkownik na stronie głównej**  
  Wpisuje tekst japoński → walidacja (znaki JP, max 280) → wysłanie `POST /api/analyses` → Skeleton → wyniki (tokeny + tłumaczenie). Może kliknąć token → Popover ze szczegółami. Może zapisać (`POST /api/saved-items`; sukces lub błąd w Toasterze po odpowiedzi serwera), skopiować. Może przejść do „Moje Zdania”.

- **Zalogowany w Bibliotece (`/moje-zdania`)**  
  Widzi sticky wyszukiwarkę i listę (Infinite Scroll). Wpisuje w wyszukiwarkę → filtrowanie (`q`). Klik w element listy → przejście do widoku pojedynczej analizy (`/analiza/[id]`) → dane z `GET /api/analyses/:id`. W widoku analizy może usunąć z biblioteki, skopiować.

- **Powrót**  
  Z widoku pojedynczej analizy: link/breadcrumb do „Moje Zdania” lub „Analiza”. Z Topbara: stale dostępne „Analiza” i „Moje Zdania”.

---

## 4. Układ i struktura nawigacji

- **Nawigacja główna**: górny pasek (Topbar) sticky na wszystkich stronach.
  - **Lewa strona**: logo (link do `/`), link „Analiza” (lub „Przykłady”) do `/`, link „Moje Zdania” do `/moje-zdania` (tylko gdy zalogowany).
  - **Prawa strona**: przełącznik motywu (jasny/ciemny), przycisk „Zaloguj” (gość) lub Avatar z dropdown (zalogowany: np. „Moje Zdania”, „Wyloguj”).

- **Nawigacja kontekstowa**:  
  W widoku pojedynczej analizy (po wejściu z Biblioteki): breadcrumb lub przycisk „Wróć do Moje Zdania” do `/moje-zdania`.

- **Bez dedykowanych podstron dla auth**: logowanie i rejestracja wyłącznie w modalach; brak `/login`, `/register` jako osobnych tras.

- **Ochrona tras**: `/moje-zdania` i ewentualnie `/analiza/[id]` (gdy id dotyczy zapisanego) — middleware/SSR weryfikuje sesję; brak sesji → przekierowanie na `/` lub pokazanie zachęty do logowania w layoutcie.

---

## 5. Kluczowe komponenty

| Komponent | Opis i użycie |
|-----------|----------------|
| **Topbar** | Sticky nagłówek z logo, linkami (Analiza, Moje Zdania), ThemeToggle i akcją konta (Zaloguj / Avatar + menu). Używany w Layout na wszystkich stronach. |
| **TokenTile** | Pojedynczy kafelek słowa w wynikach analizy: pastelowe, zaokrąglone tło według POS (obiekt konfiguracyjny POS → klasy Tailwind). Klik/ focus otwiera Popover z: surface, dictionaryForm, pos, reading, definition (i ewent. wyjaśnienie gramatyczne). Wspólny dla widoku Analizy i widoku pojedynczej analizy. |
| **AnalysisResultBlock** | Sekcja zawierająca grid tokenów (TokenTile) + blok tłumaczenia zdania + pasek akcji (Zapisz, Kopiuj). Używana na `/` po analizie oraz na `/analiza/[id]`. |
| **AnalysisToolbar** | Pasek akcji przy wynikach: Zapisz (stan „zapisane” po pomyślnej odpowiedzi serwera; sukces/błąd w Toasterze), Kopiuj. |
| **SearchBar** | Pole wyszukiwania w nagłówku Biblioteki; kontrolowane input z debounce lub submit; parametr `q` do `GET /api/saved-items`. |
| **SavedItemCard** | Karta jednego zapisanego zdania: fragment tekstu JP (Noto Sans JP, większy), tłumaczenie, data relatywna; klik → nawigacja do `/analiza/[id]`. Opcjonalnie ikona „Usuń z biblioteki”. |
| **EmptyState** | Dedykowany komponent dla pustej listy w Moje Zdania: ilustracja/ikona, krótki tekst zachęty, link do Analizy. |
| **AuthModal (Login / Register)** | Dwa Dialogi (lub jeden z przełączaną treścią): formularze email/hasło, walidacja, przełączanie między logowaniem a rejestracją. |
| **Toaster** | Globalne powiadomienia (Sonner): sukces zapisu, błąd API, błąd walidacji. |
| **Skeleton** | Placeholdery ładowania dla listy w Bibliotece, dla bloku wyników analizy i dla pojedynczego widoku analizy zamiast spinnerów. |

---

## 6. Mapowanie historyjek użytkownika (PRD) na architekturę UI

| ID | Historyjka | Elementy UI |
|----|------------|-------------|
| US-002 | Rejestracja | Modal rejestracji (email, hasło); walidacja; po sukcesie auto-login i zamknięcie modala. |
| US-003 | Logowanie | Modal logowania; komunikaty błędów; sesja utrzymywana po odświeżeniu (Supabase). |
| US-004 | Analiza nowego zdania | Widok Analizy: Textarea (max 280), walidacja JP, przycisk analizy; Skeleton; AnalysisResultBlock (tokeny + tłumaczenie). |
| US-005 | Szczegóły słowa | TokenTile + Popover po kliknięciu: forma słownikowa, gramatyka, definicja (desktop: klik; obsługa dotyku zgodnie z Radix). |
| US-006 | Zapisywanie analizy | AnalysisToolbar: przycisk „Zapisz”; `POST /api/saved-items`; Toaster z potwierdzeniem sukcesu lub błędu po odpowiedzi serwera. |
| US-007 | Przeglądanie historii | Widok Moje Zdania (`/moje-zdania`): lista z Infinite Scroll; SavedItemCard; klik → `/analiza/[id]` z danymi z API. |
| US-010 | Wyszukiwanie w historii | SearchBar w sticky nagłówku Biblioteki; parametr `q` do `GET /api/saved-items`; filtrowanie listy. |

---

## 7. Wymagania PRD → elementy UI (skrót)

- **Max 280 znaków, walidacja JP**: Textarea z licznikiem i walidacją przed wysłaniem; blokada przy braku znaków japońskich.
- **Wyniki jako interaktywne kafelki**: TokenTile w gridzie z kolorami POS (konfiguracja POS → Tailwind).
- **Klik w kafelek → szczegóły**: Popover przy TokenTile (słownik, gramatyka, definicja).
- **Tłumaczenie zdania**: Blok tekstu pod gridem tokenów w AnalysisResultBlock.
- **Auth email/hasło**: Modale logowania i rejestracji (Supabase).
- **Zapisz / lista / wyszukiwarka**: Przycisk Zapisz, widok Moje Zdania z Infinite Scroll i SearchBar; API saved-items i analyses.
- **Gość**: Analiza własnego tekstu wymusza modal logowania.

---

## 8. Przypadki brzegowe i stany błędów

- **Brak znaków japońskich**: Walidacja po stronie klienta — komunikat przy polu, przycisk analizy nieaktywny lub z blokadą.
- **Błąd 401 (niezalogowany)** przy analizie / zapisie: Otwarcie modala logowania (konwersja gościa) lub Toaster z informacją o konieczności logowania.
- **Błąd 429 (rate limit)** lub **500 (AI/backend)**: Toaster z komunikatem; użytkownik może spróbować ponownie.
- **Pusta lista Moje Zdania**: Empty State z zachętą do pierwszej analizy i zapisu.
- **Błąd ładowania pojedynczej analizy (404)**: Komunikat w widoku (np. „Nie znaleziono”) i link powrotu.
- **Błąd odpowiedzi API (np. niepoprawny format)**: Toaster z komunikatem. Walidacja danych po stronie backendu.
- **Długi tekst (np. wklejony > 280 znaków)**: Obcięcie lub walidacja i komunikat; licznik znaków informuje o limicie.

---

## 9. Zgodność z planem API

- **POST /api/analyses**: Wywołanie z widoku Analizy po walidacji; wynik renderowany w AnalysisResultBlock. Walidacja danych po stronie backendu.
- **GET /api/analyses/:id**: Używany w widoku pojedynczej analizy oraz po kliknięciu elementu Biblioteki.
- **POST /api/saved-items**: Przycisk Zapisz; body `{ analysisId }`;.
- **GET /api/saved-items**: Lista w Moje Zdania z parametrami `q`, `page`, `pageSize`, `sort`, `order`; Infinite Scroll zwiększa `page`.
- **DELETE /api/saved-items/:id**: Opcjonalnie w karcie w Bibliotece lub w widoku pojedynczej analizy („Usuń z biblioteki”).

Autoryzacja: token JWT (Supabase) w żądaniach; trasy chronione i zachowanie gościa vs zalogowany zgodne z opisem autoryzacji w planie API.

---

*Dokument architektury UI; brak w nim szczegółów implementacji i konkretnego projektu wizualnego. Nierozwiązane z sesji: paleta kolorów POS (hex/Tailwind) oraz finalne treści komunikatów błędów (copywriting) — do uzupełnienia w kolejnej iteracji.*
