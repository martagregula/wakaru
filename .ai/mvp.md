# Aplikacja - Wakaru (MVP)
### Główny problem
Uczniowie języka japońskiego na poziomie początkującym i średniozaawansowanym mają trudność z samodzielnym czytaniem autentycznych tekstów (np. piosenek, mangi, social mediów). Uczeń napotyka na skomplikowane odmiany czasowników i przymiotników (np. formy sprawcze, bierne, potencjalne łączone z zaprzeczeniami) oraz wielofunkcyjne partykuły. Ręczne szukanie rdzenia słowa w słowniku i dopasowywanie do niego reguły gramatycznej z podręcznika jest nieefektywne, wybija z rytmu lektury i zniechęca do dalszej nauki.

### Najmniejszy zestaw funkcjonalności
- Analiza Morfologiczna (NLP): Rozbijanie zdania na tokeny (wykrywanie granic słów).
- Dekoder Gramatyki: Rozpoznawanie i nazywanie form gramatycznych (np. czasownik w formie `te`, przymiotnik w formie przeczącej)
- Contextual Translation: Tłumaczenie całego zdania na język polski
- Integracja ze Słownikiem: Tooltipy z definicjami po kliknięciu w konkretne słowo.
- System Kont Użytkownika: Rejestracja/Logowanie umożliwiające personalizację.
- Notatnik "Moje Zdania": Możliwość zapisania przeanalizowanego zdania w profilu użytkownika do późniejszego powtórzenia.
- Walidacja Języka: System wykrywający, czy wklejony tekst zawiera znaki japońskie (Hiragana/Katakana/Kanji).

### Co NIE wchodzi w zakres MVP
- Toggle Furigana: Wyświetlanie czytań nad każdym słowem.
- Eksport do Anki: Generowanie gotowych fiszek do zewnętrznych aplikacji.
- Analiza tekstów długich: Ograniczenie inputu do konkretnej liczby znaków.
- Obsługa audio: Generowanie wymowy zdania.

### Ścieżki użytkownika (User Paths)
- Ścieżka Analizy: Zalogowany użytkownik wkleja zdanie -> System sprawdza, czy to japoński -> Generuje wizualne "kafelki" ze słowami -> Użytkownik najeżdża na kafelki, widząc formę gramatyczną i definicję.
- Ścieżka Archiwizacji: Użytkownik klika ikonę zapisu przy zdaniu -> Zdanie trafia do sekcji "Zapisane" w jego profilu.
- Ścieżka Edukacyjna: Użytkownik wraca do profilu, by przejrzeć historię swoich trudnych zdań.

### Kryteria sukcesu (Kontekst pod AI i Kurs)
- 90% trafności mapowania gramatyki: Logika wygenerowana przez AI poprawnie tłumaczy surowe tagi z biblioteki NLP na czytelne formy (np. "Masu-form", "Past Tense").
- 80% akceptacji analizy przez użytkownika: Użytkownik po analizie zapisuje zdanie (co uznajemy za sukces analizy i dostarczenie wartości).