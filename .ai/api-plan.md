# REST API Plan

## 1. Resources
- `analyses` -> `public.analyses`
- `saved-items` -> `public.user_saved_items`
- `reports` -> `public.analysis_reports`
- `auth` -> `auth.users` (Supabase Auth)

## 2. Endpoints
### Analyses
- **POST** `/api/analyses`
  - Description: Analyze a new Japanese text, deduplicate by hash, and return analysis.
  - Query params: none
  - Request JSON:
    ```json
    {
      "originalText": "日本語のテキスト"
    }
    ```
  - Response JSON (200/201):
    ```json
    {
      "analysis": {
        "id": "uuid",
        "originalText": "日本語のテキスト",
        "translation": "English translation",
        "data": {
          "difficulty": "N4",
          "romaji": "...",
          "tokens": [
            {
              "surface": "日本語",
              "dictionaryForm": "日本語",
              "pos": "Noun",
              "reading": "nihongo",
              "definition": "Japanese language"
            },
            {
              "surface": "の",
              "dictionaryForm": null,
              "pos": "Particle",
              "reading": "no",
              "definition": "genitive/possessive particle; links nouns (\"of\")"
            },
            {
              "surface": "テキスト",
              "dictionaryForm": "テキスト",
              "pos": "Noun",
              "reading": "tekisuto",
              "definition": "text"
            }
          ]
        },
        "isFeatured": false,
        "createdAt": "2026-01-25T12:00:00Z"
      },
      "deduplicated": true
    }
    ```
  - Success codes: `200 OK` (existing), `201 Created` (new)
  - Error codes: `400` invalid input, `401` unauthenticated, `429` rate limited, `500` AI/provider failure

- **GET** `/api/analyses/:id`
  - Description: Fetch a single analysis if the user has access (featured or saved).
  - Query params: none
  - Response JSON (200):
    ```json
    {
      "analysis": {
        "id": "uuid",
        "originalText": "日本語のテキスト",
        "translation": "English translation",
        "data": { "difficulty": "N4", "romaji": "...", "tokens": [] },
        "isFeatured": false,
        "createdAt": "2026-01-25T12:00:00Z"
      }
    }
    ```
  - Success codes: `200 OK`
  - Error codes: `401` unauthenticated (if not featured), `404` not found

- **GET** `/api/analyses/featured`
  - Description: List featured analyses for anonymous users.
  - Query params:
    - `q` (string, optional) search across `originalText`/`translation`
    - `page` (number, default 1)
    - `pageSize` (number, default 20, max 50)
    - `sort` (`createdAt` | `originalText`, default `createdAt`)
    - `order` (`asc` | `desc`, default `desc`)
  - Response JSON (200):
    ```json
    {
      "items": [
        {
          "id": "uuid",
          "originalText": "日本語のテキスト",
          "translation": "English translation",
          "isFeatured": true,
          "createdAt": "2026-01-25T12:00:00Z"
        }
      ],
      "page": 1,
      "pageSize": 20,
      "total": 120
    }
    ```
  - Success codes: `200 OK`
  - Error codes: `400` invalid query params

### Saved Items
- **POST** `/api/saved-items`
  - Description: Save an analysis to the user’s library.
  - Query params: none
  - Request JSON:
    ```json
    { "analysisId": "uuid" }
    ```
  - Response JSON (201):
    ```json
    {
      "savedItem": {
        "id": "uuid",
        "analysisId": "uuid",
        "userId": "uuid",
        "savedAt": "2026-01-25T12:00:00Z"
      }
    }
    ```
  - Success codes: `201 Created`
  - Error codes: `400` invalid payload, `401` unauthenticated, `409` already saved, `404` analysis not found

- **GET** `/api/saved-items`
  - Description: List the user’s saved analyses, sorted by saved date.
  - Query params:
    - `q` (string, optional) search across original/translation
    - `page` (number, default 1)
    - `pageSize` (number, default 20, max 50)
    - `sort` (`savedAt` | `originalText`, default `savedAt`)
    - `order` (`asc` | `desc`, default `desc`)
  - Response JSON (200):
    ```json
    {
      "items": [
        {
          "savedItemId": "uuid",
          "savedAt": "2026-01-25T12:00:00Z",
          "analysis": {
            "id": "uuid",
            "originalText": "日本語のテキスト",
            "translation": "English translation",
            "data": { "difficulty": "N4", "romaji": "...", "tokens": [] },
            "isFeatured": false,
            "createdAt": "2026-01-25T12:00:00Z"
          }
        }
      ],
      "page": 1,
      "pageSize": 20,
      "total": 12
    }
    ```
  - Success codes: `200 OK`
  - Error codes: `401` unauthenticated

- **DELETE** `/api/saved-items/:id`
  - Description: Remove a saved item from the user’s library.
  - Query params: none
  - Response JSON (204):
    ```json
    { }
    ```
  - Success codes: `204 No content`
  - Error codes: `401` unauthenticated, `404` not found

### Reports
- **POST** `/api/reports`
  - Description: Report an incorrect analysis result.
  - Query params: none
  - Request JSON:
    ```json
    { "analysisId": "uuid", "reason": "Optional text" }
    ```
  - Response JSON (201):
    ```json
    {
      "report": {
        "id": "uuid",
        "analysisId": "uuid",
        "reporterId": "uuid",
        "status": "pending",
        "createdAt": "2026-01-25T12:00:00Z"
      }
    }
    ```
  - Success codes: `201 Created`
  - Error codes: `400` invalid payload, `401` unauthenticated, `404` analysis not found

## 3. Authentication and Authorization
- Use Supabase Auth (email/password) with JWT access tokens.
- Authenticated endpoints require `Authorization: Bearer <jwt>`.
- Anonymous users can only access `GET /api/analyses/featured`.
- RLS policies enforce:
  - `analyses` read access for featured or user-saved rows.
  - `user_saved_items` read/write only by `auth.uid()`.
  - `analysis_reports` create/read only by `auth.uid()`.
- Server-side API endpoints use a service role key for analysis creation to bypass `analyses` write restrictions.

## 4. Validation and Business Logic
### Validation
- `analyses.original_text` must be <= 280 chars and contain Japanese characters.
- `analyses.text_hash` must be unique and derived from normalized text (trim + whitespace normalization) using SHA-256.
- `analyses.data` is required JSON and must include tokens, translation, and difficulty fields as returned by AI.
- `analysis_reports.status` must be one of `pending`, `reviewed`, `rejected`.
- `user_saved_items` must be unique on `(user_id, analysis_id)`.

### Business Logic
- Deduplication: on analyze request, compute `text_hash` and return existing analysis if present; otherwise call AI and insert.
- Guest access: anonymous users can only read `is_featured = true` analyses.
- Saved items: saving creates a row in `user_saved_items`; listing joins `analyses` for full display.
- Search: `q` for saved items uses trigram search against `original_text` and `translation`.
- Reporting: create a report with `status = pending`; updates/deletes restricted to server-side moderation workflows.
