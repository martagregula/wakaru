# Plan wdrożenia integracji OpenRouter Service

Ten dokument przedstawia szczegółowy plan integracji istniejącego endpointu `POST /api/analyses` z serwisem `OpenRouterService` w celu zastąpienia obecnych danych testowych (mock) rzeczywistą analizą AI języka japońskiego.

## Cel
Wdrożenie pełnej funkcjonalności analizy tekstu japońskiego poprzez połączenie warstwy API (`analyses.ts`), serwisu logiki biznesowej (`ai.service.ts`) oraz klienta zewnętrznego API (`openrouter.service.ts`).

## 1. Przegląd architektury

Obecny stan systemu:
- **API Endpoint**: `src/pages/api/analyses.ts` (Zaimplementowany, gotowy do użycia).
- **Database Service**: `src/lib/services/analysis.service.ts` (Zaimplementowany, obsługuje zapis/odczyt i deduplikację).
- **OpenRouter Client**: `src/lib/services/openrouter.service.ts` (Zaimplementowany, generyczny klient).
- **AI Service**: `src/lib/services/ai.service.ts` (Istnieje, ale zwraca **dane testowe/mock**).

**Główne zadanie**: Implementacja logiki w `src/lib/services/ai.service.ts`.

## 2. Wymagania wstępne

Upewnij się, że w pliku `.env` znajdują się niezbędne zmienne środowiskowe:

```bash
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=Wakaru
```

## 3. Plan Implementacji

### Krok 1: Definicja Schematów Zod dla AI

W pliku `src/lib/services/ai.service.ts` należy zdefiniować schematy Zod odpowiadające interfejsom z `src/types.ts`. Jest to kluczowe dla funkcji "Structured Outputs" OpenRoutera, aby zagwarantować poprawny format JSON.

Będziemy potrzebować schematu, który łączy `AnalysisDataDTO` oraz pole `translation`.

**Struktura schematu do zaimplementowania:**

1.  `TokenSchema`: Odpowiada `TokenDTO` (surface, dictionaryForm, pos, reading, definition).
2.  `AnalysisResponseSchema`: Łączy dane analizy i tłumaczenie.

```typescript
// Przykład struktury (do dopracowania w kodzie):
const TokenSchema = z.object({
  surface: z.string(),
  dictionaryForm: z.string().nullable(),
  pos: z.enum([...]), // Użyj typu PartOfSpeech z types.ts
  reading: z.string(),
  definition: z.string(),
});

const AIResponseSchema = z.object({
  translation: z.string(),
  difficulty: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  romaji: z.string(),
  tokens: z.array(TokenSchema),
});
```

### Krok 2: Implementacja Prompt Engineering

Należy przygotować System Prompt, który precyzyjnie poinstruuje model, jak ma analizować tekst.

**Kluczowe elementy promptu:**
- Rola: Nauczyciel języka japońskiego.
- Zadanie: Analiza morfologiczna, tokenizacja, tłumaczenie.
- Kontekst: Wyjaśnienia dla początkujących i średniozaawansowanych w zależności od stopnia złozenia zdania.
- Formatowanie: Strict JSON (wymuszone przez schemat, ale warto wspomnieć w prompcie).
- Obsługa błędów: Instrukcja co zrobić w przypadku niezrozumiałego tekstu.

### Krok 3: Aktualizacja `analyzeJapaneseText` w `ai.service.ts`

Należy nadpisać funkcję `analyzeJapaneseText`, usuwając mocki i wprowadzając wywołanie `OpenRouterService`.

**Logika funkcji:**
1.  Inicjalizacja `OpenRouterService`.
2.  Przygotowanie wiadomości (`messages`):
    - `system`: Prompt definicyjny.
    - `user`: Tekst do analizy.
3.  Wywołanie `service.complete` z parametrami:
    - `model`: `openai/gpt-4o-mini`.
    - `schema`: Zdefiniowany `AIResponseSchema`.
4.  Mapowanie odpowiedzi z AI na strukturę `AIAnalysisResult`.
5.  Obsługa błędów (np. jeśli AI zwróci błędny format lub API zwróci błąd).

### Krok 4: Weryfikacja Integracji

Po implementacji serwisu, cały przepływ danych będzie wyglądał następująco:

1.  **Request**: `POST /api/analyses` z `{ originalText: "..." }`.
2.  **Validation**: Zod weryfikuje input.
3.  **Deduplication**: Hash tekstu sprawdzany w DB (`analysis.service.ts`).
4.  **AI Processing**: Jeśli brak w DB -> `ai.service.ts` -> OpenRouter -> JSON.
5.  **Persistence**: Zapis wyniku do DB (`analysis.service.ts`).
6.  **Response**: Zwrot danych do klienta.

Ponieważ `analyses.ts` i `analysis.service.ts` są już gotowe, zmiana w `ai.service.ts` automatycznie "ożywi" ten endpoint.

## 4. Szczegóły Techniczne

### Sugerowany Model AI
Do tego zadania rekomendowane jest użycie modelu wspierającego Structured Outputs (JSON Mode) o niskiej latencji.

- **Primary**: `openai/gpt-4o-mini`.
- **Fallback**: `google/gemini-2.0-flash-001` (Bardzo szybki, darmowy tier na OpenRouter).

### Typy POS (Parts of Speech)
Upewnij się, że enum w Zod zgadza się z typem `PartOfSpeech` w `src/types.ts`:
`Noun`, `Verb`, `Adjective`, `Adverb`, `Particle`, `Conjunction`, `Interjection`, `Pronoun`, `Determiner`, `Preposition`, `Auxiliary`, `Other`.

## 5. Lista kontrolna wdrożenia

- [ ] Utworzenie definicji Zod Schema w `src/lib/services/ai.service.ts`.
- [ ] Zdefiniowanie stałej z System Promptem.
- [ ] Implementacja logiki wywołania `openRouterService.complete`.
- [ ] Mapowanie wyniku AI na `AIAnalysisResult`.
- [ ] Przetestowanie endpointu przy użyciu narzędzia CURL lub Postman.
- [ ] Weryfikacja zapisanych danych w tabeli `analyses` w Supabase.
