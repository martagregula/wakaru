import * as React from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

function SearchBar({ onSearch, placeholder = "Szukaj w zapisanych zdaniach" }: SearchBarProps) {
  const inputId = React.useId();
  const [value, setValue] = React.useState("");
  const hasMountedRef = React.useRef(false);

  React.useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const debounceId = window.setTimeout(() => {
      onSearch(value.trim());
    }, 400);

    return () => {
      window.clearTimeout(debounceId);
    };
  }, [onSearch, value]);

  return (
    <div className="relative">
      <label className="sr-only" htmlFor={inputId}>
        Wyszukaj zapisane zdania
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="pl-9"
        data-testid="saved-items-search-input"
      />
    </div>
  );
}

export { SearchBar };
