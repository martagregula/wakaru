import { SearchBar } from "@/components/features/saved-items/SearchBar";

interface SavedItemsHeaderProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

function SavedItemsHeader({ onSearch, isSearching }: SavedItemsHeaderProps) {
  return (
    <header
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      data-testid="saved-items-header"
    >
      <div>
        <p
          className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          data-testid="saved-items-kicker"
        >
          Biblioteka
        </p>
        <h1 className="text-3xl font-semibold text-foreground" data-testid="saved-items-title">
          Moje zdania
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {isSearching ? "Szukam pasujących zdań..." : "Twoje zapisane analizy w jednym miejscu."}
        </p>
      </div>
      <div className="w-full sm:max-w-sm" data-testid="saved-items-search-wrapper">
        <SearchBar onSearch={onSearch} />
      </div>
    </header>
  );
}

export { SavedItemsHeader };
