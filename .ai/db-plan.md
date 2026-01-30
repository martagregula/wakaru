# Database Schema Plan for Wakaru MVP

This document outlines the database schema designed for the Wakaru MVP, utilizing Supabase (PostgreSQL). The design focuses on efficient storage of AI analysis results and user management.

## 1. Extensions

The following PostgreSQL extensions are required:

- **pg_trgm**: For efficient full-text search and similarity matching on Japanese and English text.
- **pgcrypto**: For generating UUIDs and hashing functions (if needed within DB).

## 2. Tables

### `users`

This table is managed by Supabase Auth and contains the user credentials and basic information.

### `analyses`
The central repository for analysis results. Designed to be shared across users to deduplicate API costs.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Unique identifier for the analysis. |
| `original_text` | `text` | NOT NULL | The source Japanese text submitted for analysis. |
| `translation` | `text` | | The full sentence translation provided by AI. |
| `data` | `jsonb` | NOT NULL | Structured output: tokens (surface, pos, reading, meaning), difficulty, etc. |
| `text_hash` | `text` | UNIQUE, NOT NULL | SHA-256 hash of `original_text` for fast lookups/deduplication. |
| `is_featured` | `boolean` | DEFAULT false | Flag for public/example sentences available to all users. |
| `created_at` | `timestamptz` | DEFAULT now(), NOT NULL | Analysis creation timestamp. |

### `user_saved_items`
A join table representing the "My Saved Items" library. Maps users to analyses.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Unique ID for the saved reference. |
| `user_id` | `uuid` | FK to `auth.users(id)`, NOT NULL | The user who saved the item. |
| `analysis_id` | `uuid` | FK to `analyses(id)`, NOT NULL | The analysis being saved. |
| `saved_at` | `timestamptz` | DEFAULT now(), NOT NULL | When the user saved this specific item. |

**Constraints:**
- Unique composite constraint on `(user_id, analysis_id)` to prevent duplicate saves of the same item by the same user.
- FK `analysis_id` has `ON DELETE RESTRICT` (cannot delete an analysis if users have saved it).
- FK `user_id` has `ON DELETE CASCADE` (if user is deleted, their saved items are removed).

### `analysis_reports`
Allows users to flag incorrect analysis results (US-009).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Unique report ID. |
| `analysis_id` | `uuid` | FK to `analyses(id)`, NOT NULL | The flagged analysis. |
| `reporter_id` | `uuid` | FK to `auth.users(id)`, NOT NULL | The user reporting the issue. |
| `reason` | `text` | | Optional user-provided reason. |
| `status` | `text` | DEFAULT 'pending' | Status: 'pending', 'reviewed', 'rejected'. |
| `created_at` | `timestamptz` | DEFAULT now(), NOT NULL | Report timestamp. |

## 3. Relationships

- **users** - **user_saved_items**: One-to-Many (1:N). A user can save many items.
- **analyses** - **user_saved_items**: One-to-Many (1:N). An analysis can be saved by many users.
- **users** - **analysis_reports**: One-to-Many (1:N).
- **analyses** - **analysis_reports**: One-to-Many (1:N).

## 4. Indexes

To ensure high performance for critical read paths:

1.  **Search & Deduplication**:
    - `analyses(text_hash)`: **UNIQUE INDEX**. Critical for fast existence checks before calling AI API.
    - `analyses(original_text)`: **GIN INDEX** (using `gin_trgm_ops`). For fuzzy/full-text search in Japanese.
    - `analyses(translation)`: **GIN INDEX** (using `gin_trgm_ops`). For searching English meanings.

2.  **User Library**:
    - `user_saved_items(user_id, saved_at DESC)`: **Composite Index**. Optimizes fetching "My Saved Items" sorted by date.
    - `user_saved_items(analysis_id)`: Index for FK lookups.

## 5. Security (Row Level Security & Functions)

### RLS Policies - IGNORE FOR NOW!

- **analyses**:
    - `SELECT`: Permitted if `is_featured = true` OR if the user has a corresponding record in `user_saved_items`. (Note: During creation, the backend/RPC will bypass RLS to check existence/insert new records).

- **user_saved_items**:
    - `SELECT`: Users can view their own rows (where `user_id = auth.uid()`).
    - `INSERT`: Users can insert rows linked to their own `user_id` (where `user_id = auth.uid()`).
    - `DELETE`: Users can delete their own rows (where `user_id = auth.uid()`).

- **analysis_reports**:
    - `INSERT`: Authenticated users can create reports (where `reporter_id = auth.uid()`).
    - `SELECT`: Users can view their own reports (or admins only).

## 6. Implementation Notes

- **JSONB Structure**: The `data` column in `analyses` uses a flexible schema to accommodate potential future AI output changes without migration:
  ```json
  {
    "difficulty": "N4",
    "romaji": "...",
    "tokens": [
      {
        "surface": "私",
        "dictionaryForm": "私",
        "pos": "Noun",
        "reading": "watashi",
        "definition": "I; me"
      },
      ...
    ]
  }
  ```
- **Text Hash**: The backend/client should normalize the text (trim, normalize whitespace) before hashing (SHA-256) to ensure consistent deduplication.
