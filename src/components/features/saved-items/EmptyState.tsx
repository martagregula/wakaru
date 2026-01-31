import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  searchQuery: string;
}

function EmptyState({ searchQuery }: EmptyStateProps) {
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <Card data-testid="saved-items-empty-state">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="space-y-1">
          <p className="text-lg font-semibold text-foreground">
            {hasQuery ? `Nie znaleziono frazy "${searchQuery}"` : "Nie masz jeszcze zapisanych analiz."}
          </p>
          <p className="text-sm text-muted-foreground">
            {hasQuery ? "Spróbuj innego zapytania lub usuń filtr." : "Wróć do widoku analizy i zapisz ulubione zdania."}
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/">Analizuj nowe zdanie</a>
        </Button>
      </CardContent>
    </Card>
  );
}

export { EmptyState };
