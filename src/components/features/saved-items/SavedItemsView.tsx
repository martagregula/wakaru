import * as React from "react";

import { EmptyState } from "@/components/features/saved-items/EmptyState";
import { SavedItemsHeader } from "@/components/features/saved-items/SavedItemsHeader";
import { SavedItemsList } from "@/components/features/saved-items/SavedItemsList";
import { SavedItemsSkeleton } from "@/components/features/saved-items/SavedItemsSkeleton";
import { useSavedItems } from "@/components/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function SavedItemsView() {
  const {
    items,
    hasMore,
    isLoading,
    isFetchingNextPage,
    searchQuery,
    error,
    loadMore,
    deleteItem,
    retry,
    setSearchQuery,
  } = useSavedItems();

  const isInitialLoading = isLoading && items.length === 0;
  const showEmptyState = !isInitialLoading && !error && items.length === 0;

  const handleSearch = React.useCallback(
    (query: string) => {
      setSearchQuery(query);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchQuery]
  );

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10" data-feature="saved-items">
      <SavedItemsHeader onSearch={handleSearch} isSearching={isLoading && Boolean(searchQuery)} />

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" onClick={retry}>
              Spróbuj ponownie
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {isInitialLoading ? <SavedItemsSkeleton /> : null}

      {showEmptyState ? <EmptyState searchQuery={searchQuery} /> : null}

      {!isInitialLoading && items.length > 0 ? (
        <SavedItemsList
          items={items}
          isLoadingMore={isFetchingNextPage}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onDelete={deleteItem}
        />
      ) : null}
    </section>
  );
}

export { SavedItemsView };
