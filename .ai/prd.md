# Dokument wymagań produktu (PRD) - Wakaru

## 1. Przegląd produktu

Wakaru to aplikacja internetowa zaprojektowana, aby pomóc uczniom języka japońskiego na poziomie początkującym i średniozaawansowanym w czytaniu i rozumieniu autentycznych tekstów. Aplikacja wykorzystuje sztuczną inteligencję do analizy morfologicznej i gramatycznej japońskich zdań, eliminując konieczność żmudnego ręcznego wyszukiwania słów i reguł w słownikach.

Celem wersji MVP jest dostarczenie narzędzia, które pozwala użytkownikom wkleić krótkie fragmenty tekstu (np. z mangi, Twittera), otrzymać natychmiastowe wyjaśnienie struktury zdania i znaczenia słów, a także zapisywać te analizy do późniejszej powtórki.

## 2. Problem użytkownika

Uczniowie języka japońskiego często napotykają "ścianę", gdy próbują przejść od podręczników do prawdziwych treści. Główne problemy to:

*   Trudność w identyfikacji granic słów w tekście zapisanym ciągiem (bez spacji).
*   Skomplikowane odmiany czasowników i przymiotników (formy sprawcze, bierne, potencjalne), które utrudniają znalezienie rdzenia słowa w słowniku.
*   Wielofunkcyjność partykuł, których znaczenie zależy od kontekstu.
*   Konieczność korzystania z wielu zewnętrznych narzędzi jednocześnie (słownik, kompendium gramatyki, translator), co wybija z rytmu czytania i zniechęca do nauki.

## 3. Wymagania funkcjonalne

### 3.1. Analiza tekstu (Core)
*   System umożliwia wprowadzenie tekstu japońskiego o długości do 280 znaków.
*   Aplikacja waliduje, czy wprowadzony tekst zawiera znaki japońskie (Hiragana, Katakana, Kanji).
*   System wykorzystuje model AI (gpt-4o-mini) do przetworzenia tekstu i zwrócenia sformatowanych danych JSON zawierających: tokenizację, analizę morfologiczną, tłumaczenie kontekstowe całego zdania oraz definicje słów.
*   Wyniki analizy są prezentowane w formie interaktywnych kafelków reprezentujących poszczególne słowa/tokeny.

### 3.2. Interakcja z wynikami
*   Użytkownik może kliknąć (desktop) lub dotknąć (mobile) kafelek słowa, aby wyświetlić szczegóły: formę słownikową, rozpoznaną formę gramatyczną (np. "Past Tense") oraz definicję w języku angielskim.
*   Pod analizowanym zdaniem wyświetlane jest całościowe, kontekstowe tłumaczenie zdania na język angielski.

### 3.3. System kont i zarządzanie danymi
*   System umożliwia rejestrację i logowanie przy użyciu adresu email i hasła (Supabase Auth).
*   Zalogowani użytkownicy mogą zapisać przeanalizowane zdanie.
*   System przechowuje pełny wynik analizy (JSON) w bazie danych, aby uniknąć ponownego generowania kosztów przy odczycie.
*   Użytkownik ma dostęp do listy swoich zapisanych zdań ("Moje Zdania"), sortowanej chronologicznie.
*   Dostępna jest prosta wyszukiwarka tekstowa w obrębie zapisanych zdań.

### 3.4. Ograniczenia i limity
*   Użytkownicy niezalogowani mają dostęp wyłącznie do predefiniowanych "zdań przykładowych" i nie mogą wprowadzać własnego tekstu.

## 4. Granice produktu

### W zakresie (In Scope) MVP
*   Analiza krótkich tekstów (max 280 znaków).
*   Interfejs w języku angielskim.
*   Walidacja inputu (wykrywanie języka japońskiego).
*   Podstawowe uwierzytelnianie (Email/Hasło).
*   Zapisywanie historii analiz.
*   Obsługa błędów poprzez prosty formularz zgłoszenia ("Report Issue").

### Poza zakresem (Out of Scope) MVP
*   Generowanie i wyświetlanie furigany nad każdym słowem (toggle).
*   Eksport do Anki (fiszki).
*   Analiza długich tekstów powyżej 280 znaków.
*   Synteza mowy (audio/TTS).
*   Mechanizm resetowania hasła ("Forgot Password").
*   Zaawansowane animacje ładowania.
*   Wersje językowe inne niż angielska.

## 5. Historyjki użytkowników

### US-001: Przeglądanie przykładów bez logowania
*   Tytuł: Dostęp gościa do przykładów
*   Opis: Jako niezalogowany użytkownik chcę wybrać jedno z gotowych zdań przykładowych, aby zobaczyć, jak działa aplikacja, bez konieczności zakładania konta.
*   Kryteria akceptacji:
    *   Na stronie głównej widoczna jest sekcja z predefiniowanymi zdaniami.
    *   Kliknięcie w przykład natychmiast wyświetla widok analizy (kafelki + tłumaczenie).
    *   System nie wymaga logowania do tej akcji.

### US-002: Rejestracja użytkownika
*   Tytuł: Zakładanie konta
*   Opis: Jako nowy użytkownik chcę utworzyć konto przy użyciu adresu email i hasła, aby móc analizować własne zdania i je zapisywać.
*   Kryteria akceptacji:
    *   Formularz rejestracji przyjmuje email i hasło.
    *   System waliduje poprawność formatu email.
    *   Po udanej rejestracji użytkownik jest automatycznie zalogowany.
    *   Konto użytkownika jest tworzone w bazie Supabase.

### US-003: Logowanie do systemu
*   Tytuł: Uwierzytelnianie
*   Opis: Jako powracający użytkownik chcę zalogować się na swoje konto, aby uzyskać dostęp do moich zapisanych zdań.
*   Kryteria akceptacji:
    *   Użytkownik może zalogować się poprawnym emailem i hasłem.
    *   Błędne dane logowania wyświetlają odpowiedni komunikat błędu.
    *   Sesja użytkownika jest utrzymywana po odświeżeniu strony.

### US-004: Analiza nowego zdania
*   Tytuł: Generowanie analizy gramatycznej
*   Opis: Jako zalogowany użytkownik chcę wkleić japońskie zdanie i otrzymać jego analizę, aby zrozumieć jego strukturę i znaczenie.
*   Kryteria akceptacji:
    *   Pole tekstowe akceptuje max 280 znaków.
    *   System sprawdza, czy tekst zawiera znaki japońskie; jeśli nie, wyświetla błąd walidacji.
    *   Wyświetlany jest wskaźnik ładowania podczas oczekiwania na API.
    *   Wynik prezentowany jest jako sekwencja kafelków oraz pełne tłumaczenie poniżej.

### US-005: Szczegóły słowa
*   Tytuł: Podgląd definicji i gramatyki
*   Opis: Jako użytkownik chcę kliknąć w konkretne słowo w przeanalizowanym zdaniu, aby zobaczyć jego definicję słownikową i formę gramatyczną.
*   Kryteria akceptacji:
    *   Kliknięcie w kafelek otwiera tooltip lub panel z detalami.
    *   Wyświetlane informacje zawierają: oryginalną formę, formę słownikową, wyjaśnienie gramatyczne (np. "Causative form") i definicję po angielsku.
    *   Interakcja działa poprawnie zarówno na kliknięcie myszą, jak i dotknięcie na ekranie dotykowym.

### US-006: Zapisywanie analizy
*   Tytuł: Archiwizacja zdania
*   Opis: Jako użytkownik chcę zapisać wynik analizy, aby móc do niego wrócić później.
*   Kryteria akceptacji:
    *   Dostępny jest przycisk "Zapisz" przy wynikach analizy.
    *   Zapisane zdanie trafia do bazy danych powiązanej z kontem użytkownika.
    *   Użytkownik otrzymuje potwierdzenie zapisania.

### US-007: Przeglądanie historii
*   Tytuł: Lista Moje Zdania
*   Opis: Jako użytkownik chcę przeglądać listę moich zapisanych zdań, aby powtórzyć materiał.
*   Kryteria akceptacji:
    *   Dostępna jest sekcja "Moje Zdania" w profilu.
    *   Lista wyświetla zapisane zdania posortowane od najnowszych.
    *   Kliknięcie w element listy otwiera pełny widok analizy tego zdania (bez komunikacji z zewnętrznym API AI).

### US-009: Zgłaszanie błędów analizy
*   Tytuł: Raportowanie problemów
*   Opis: Jako użytkownik chcę zgłosić, że analiza AI jest błędna, aby twórcy mogli poprawić jakość promptów w przyszłości.
*   Kryteria akceptacji:
    *   Przy każdym wyniku analizy dostępny jest przycisk "Report Issue".
    *   Zgłoszenie nie wymaga wpisywania treści, jest prostym sygnałem flagującym konkretne ID analizy w systemie.

### US-010: Wyszukiwanie w historii
*   Tytuł: Filtrowanie zapisanych zdań
*   Opis: Jako użytkownik chcę wyszukać konkretne zdanie w mojej historii, aby szybko znaleźć interesujący mnie fragment.
*   Kryteria akceptacji:
    *   Pole wyszukiwania filtruje listę "Moje Zdania" w czasie rzeczywistym lub po zatwierdzeniu.
    *   Wyszukiwanie obejmuje treść japońską oraz angielskie tłumaczenie.

## 6. Metryki sukcesu

### 6.1. Jakość techniczna
*   **Wskaźnik poprawności JSON:** 95% odpowiedzi z API AI zawiera poprawnie sformatowany JSON, który frontend jest w stanie wyrenderować bez błędów.

### 6.2. Zaangażowanie użytkownika
*   **Wskaźnik zapisu (Save Rate):** 80% użytkowników po wykonaniu analizy decyduje się na zapisanie zdania w swojej historii (co świadczy o subiektywnej wartości dostarczonej analizy).
*   **Retencja:** 30% użytkowników, którzy założyli konto, wraca do aplikacji w ciągu 7 dni od rejestracji.
