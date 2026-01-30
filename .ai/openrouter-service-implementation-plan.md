# Plan Wdrożenia Usługi OpenRouter

Plan implementacji usługi `OpenRouterService`. Usługa ta będzie odpowiedzialna za komunikację z interfejsem API OpenRouter w celu generowania uzupełnień czatu (chat completions) opartych na LLM, z naciskiem na ustrukturyzowane dane wyjściowe (Structured Outputs).

## 1. Opis Usługi

`OpenRouterService` to warstwa abstrakcji nad surowym API OpenRouter. Jej głównym celem jest zapewnienie typowanego, bezpiecznego i łatwego w użyciu interfejsu dla pozostałej części aplikacji (np. endpointów API Astro). Usługa będzie działać wyłącznie po stronie serwera (Server-Side), aby chronić klucze API.

Kluczowe cechy:
- Obsługa wielu modeli (np. OpenAI, Google, Anthropic) poprzez ujednolicony interfejs.
- Wbudowana obsługa `json_schema` dla ustrukturyzowanych odpowiedzi.
- Automatyczne zarządzanie nagłówkami wymaganymi przez OpenRouter (Referer, X-Title).
- Solidna obsługa błędów i typowanie odpowiedzi.

## 2. Opis Konstruktora

Konstruktor usługi powinien być prosty i weryfikować istnienie niezbędnych zmiennych środowiskowych.

### Sygnatura
```typescript
constructor(config?: OpenRouterConfig)
```

### Logika Inicjalizacji
1. **Pobranie Konfiguracji**: Jeśli konfiguracja nie została przekazana, pobierz wartości ze zmiennych środowiskowych:
   - `OPENROUTER_API_KEY` (Wymagane)
   - `OPENROUTER_SITE_URL` (Opcjonalne, domyślnie URL lokalny lub produkcyjny)
   - `OPENROUTER_APP_NAME` (Opcjonalne, nazwa aplikacji)
2. **Walidacja**: Sprawdź, czy `apiKey` jest zdefiniowany. Jeśli nie, rzuć błąd `OpenRouterConfigurationError`.

## 3. Publiczne Metody i Pola

### `complete<T>`

Główna metoda do interakcji z LLM.

```typescript
async complete<T>(
  messages: Message[], 
  options: CompletionOptions<T>
): Promise<CompletionResult<T>>
```

**Argumenty:**
- `messages`: Tablica obiektów `{ role: 'system' | 'user' | 'assistant', content: string }`.
- `options`: Obiekt zawierający:
  - `model`: (string) Np. "google/gemini-2.0-flash-001".
  - `schema`: (ZodSchema opcjonalne) Schemat Zod do walidacji i generowania `json_schema`.
  - `temperature`: (number opcjonalne) Stopień losowości.
  - `maxTokens`: (number opcjonalne).

**Zwraca:**
- Obiekt zawierający sparsowane dane typu `T` (jeśli podano schemat) lub surowy tekst.

**Implementacja Structured Outputs:**
Jeśli podano parametr `schema` (Zod), metoda automatycznie:
1. Konwertuje schemat Zod na JSON Schema zgodny z OpenRouter (strict mode).
2. Ustawia parametr `response_format` w żądaniu API.
3. Parsuje i waliduje odpowiedź API przy użyciu podanego schematu.

### Typy Danych (DTO)

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionOptions<T> {
  model: string;
  schema?: ZodSchema<T>; // Opcjonalne: jeśli podane, wymusza JSON
  schemaName?: string;   // Nazwa schematu dla API
  temperature?: number;
  maxTokens?: number;
}

interface CompletionResult<T> {
  content: string | T;   // T jeśli użyto schematu, string w przeciwnym razie
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}
```

## 4. Prywatne Metody i Pola

- `private apiKey: string;`
- `private siteUrl: string;`
- `private appName: string;`
- `private baseUrl = "https://openrouter.ai/api/v1";`

### `private convertZodToJsonSchema(schema: ZodSchema, name: string): object`
Metoda pomocnicza konwertująca obiekt Zod na format oczekiwany przez OpenRouter:
```json
{
  "type": "json_schema",
  "json_schema": {
    "name": "schema_name",
    "strict": true,
    "schema": { ... }
  }
}
```

### `private handleApiError(response: Response): Promise<void>`
Analizuje odpowiedź HTTP z kodem błędu i rzuca odpowiedni wyjątek `OpenRouterError` z czytelnym komunikatem (np. parsując ciało błędu z API).

## 5. Obsługa Błędów

Usługa powinna definiować i rzucać specyficzne typy błędów, aby ułatwić debugowanie i obsługę w warstwie wyższej.

### Klasy Błędów

1. **`OpenRouterConfigurationError`**:
   - Rzucany, gdy brakuje klucza API w zmiennych środowiskowych.
   
2. **`OpenRouterApiError`**:
   - Rzucany, gdy API zwróci status inny niż 2xx.
   - Pola: `status` (np. 401, 429, 500), `code` (np. "context_length_exceeded"), `message`.

3. **`OpenRouterParseError`**:
   - Rzucany, gdy odpowiedź modelu nie jest poprawnym JSON-em lub nie pasuje do schematu Zod (pomimo użycia trybu strict).

4. **`OpenRouterTimeoutError`**:
   - Rzucany, gdy żądanie przekroczy zdefiniowany czas oczekiwania.

## 6. Kwestie Bezpieczeństwa

1. **Environment Variables**: Klucze API **NIGDY** nie mogą być hardcode'owane w kodzie. Muszą pochodzić z `.env`.
2. **Server-Side Only**: Usługa musi być importowana i używana tylko w kontekście serwerowym (np. w plikach `.ts` w `src/lib/services` wywoływanych przez API routes Astro lub Server Actions). Należy unikać importowania jej w komponentach klienckich React (`.tsx` bez dyrektywy `client:only` to ryzyko, ale Astro domyślnie renderuje na serwerze - mimo to, kod usługi nie powinien trafić do bundle'a klienta).
3. **Input Validation**: Przed wysłaniem do API, treść wiadomości użytkownika powinna być sanitowana lub weryfikowana pod kątem długości, aby uniknąć nadmiernego zużycia tokenów (DDoS kosztowy).

## 7. Plan Wdrożenia Krok po Kroku

### Krok 1: Przygotowanie Środowiska
1.  Zainstaluj wymagane biblioteki (jeśli jeszcze ich nie ma):
    ```bash
    npm install zod
    ```
    *(Uwaga: `zod-to-json-schema` może być przydatne, ale dla prostych schematów można użyć ręcznej konwersji lub `zod` z wbudowanymi helperami, jeśli wersja na to pozwala. Zaleca się jednak użycie sprawdzonej biblioteki do konwersji, np. `zod-to-json-schema`)*.
    ```bash
    npm install zod-to-json-schema
    ```
2.  Dodaj zmienne do pliku `.env`:
    ```env
    OPENROUTER_API_KEY=sk-or-v1-...
    OPENROUTER_SITE_URL=http://localhost:3000
    OPENROUTER_APP_NAME=Wakaru
    ```

### Krok 2: Utworzenie Pliku Usługi
Utwórz plik `src/lib/services/openrouter.service.ts`.

### Krok 3: Implementacja Klasy i Konstruktora
Zaimplementuj klasę `OpenRouterService` wraz z konstruktorem wczytującym zmienne. Dodaj walidację istnienia klucza.

### Krok 4: Implementacja Metod Pomocniczych
1.  Dodaj metodę `convertZodToJsonSchema` wykorzystującą `zod-to-json-schema`.
    *Ważne*: OpenRouter (podobnie jak OpenAI) wymaga, aby `additionalProperties` było ustawione na `false` w trybie strict. Należy upewnić się, że konwersja to uwzględnia.

### Krok 5: Implementacja Metody `complete`
Zaimplementuj logikę `fetch`:
-   Ustawienie URL i nagłówków (`Authorization`, `HTTP-Referer`, `X-Title`, `Content-Type`).
-   Konstrukcja body: mapowanie `messages`, dodanie `response_format` jeśli przekazano `schema`.
-   Obsługa `fetch`.

### Krok 6: Obsługa Błędów i Parsowanie
-   Dodaj sprawdzenie `response.ok`.
-   Jeśli błąd: odczytaj body i rzuć `OpenRouterApiError`.
-   Jeśli sukces:
    -   Pobierz `data.choices[0].message.content`.
    -   Jeśli użyto `schema`, sparsuj JSON (`JSON.parse`) i zwaliduj Zodem (`schema.parse`).
    -   Zwróć wynik.

---

### Przykładowy Kod (Szkic Implementacji)

```typescript
// src/lib/services/openrouter.service.ts
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

export class OpenRouterService {
  private apiKey: string;
  private baseUrl = "https://openrouter.ai/api/v1";
  private siteUrl: string;
  private appName: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.siteUrl = process.env.OPENROUTER_SITE_URL || '';
    this.appName = process.env.OPENROUTER_APP_NAME || '';

    if (!this.apiKey) {
      throw new Error("OpenRouterConfigurationError: Missing OPENROUTER_API_KEY");
    }
  }

  async complete<T>(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options: {
      model: string;
      schema?: z.ZodType<T>;
      schemaName?: string;
      temperature?: number;
    }
  ): Promise<T | string> {
    
    let body: any = {
      model: options.model,
      messages: messages,
      temperature: options.temperature,
    };

    if (options.schema) {
      const jsonSchema = zodToJsonSchema(options.schema, options.schemaName || "output_schema");
      // Dostosowanie do formatu OpenAI/OpenRouter Structured Outputs
      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: options.schemaName || "output_schema",
          strict: true,
          schema: jsonSchema,
        },
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": this.siteUrl,
          "X-Title": this.appName,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenRouterApiError: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      if (options.schema) {
        try {
          const parsed = JSON.parse(content);
          return options.schema.parse(parsed);
        } catch (e) {
          throw new Error(`OpenRouterParseError: Failed to parse structured output. Content: ${content}`);
        }
      }

      return content;
    } catch (error) {
      // Logowanie błędu i rzucenie dalej
      console.error("OpenRouter Service Error:", error);
      throw error;
    }
  }
}
```
