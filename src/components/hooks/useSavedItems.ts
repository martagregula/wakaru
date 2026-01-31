import * as React from "react";

import type { PaginatedSavedItemsDTO, SavedItemWithAnalysisDTO } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { ApiError, fetchJson } from "@/lib/utils/api";

const PAGE_SIZE = 20;

function useSavedItems() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<SavedItemWithAnalysisDTO[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const previousItemsRef = React.useRef<SavedItemWithAnalysisDTO[]>([]);
  const isLoadMorePendingRef = React.useRef(false);

  const loadItems = React.useCallback(async () => {
    const isFirstPage = page === 1;
    if (isFirstPage) {
      setIsLoading(true);
    } else {
      setIsFetchingNextPage(true);
    }
    setError(null);

    try {
      const data = await fetchJson<PaginatedSavedItemsDTO>("/api/saved-items", {
        params: {
          page,
          pageSize: PAGE_SIZE,
          q: searchQuery,
          sort: "savedAt",
          order: "desc",
        },
      });

      let nextLength = 0;
      setItems((prev) => {
        const nextItems = isFirstPage ? data.items : [...prev, ...data.items];
        nextLength = nextItems.length;
        return nextItems;
      });
      setHasMore(data.total > nextLength);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.assign("/login");
        return;
      }
      const message = error instanceof ApiError ? error.message : "Nie udało się pobrać zapisanych zdań.";
      setError(message);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      setIsFetchingNextPage(false);
      isLoadMorePendingRef.current = false;
    }
  }, [page, searchQuery]);

  React.useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const loadMore = React.useCallback(() => {
    if (isLoading || isFetchingNextPage || !hasMore || error) {
      return;
    }
    if (isLoadMorePendingRef.current) {
      return;
    }
    isLoadMorePendingRef.current = true;
    setPage((prev) => prev + 1);
  }, [error, hasMore, isFetchingNextPage, isLoading]);

  const updateSearchQuery = React.useCallback((query: string) => {
    setSearchQuery(query);
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    isLoadMorePendingRef.current = false;
  }, []);

  const retry = React.useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    isLoadMorePendingRef.current = false;
  }, []);

  const deleteItem = React.useCallback(
    async (savedItemId: string) => {
      setItems((prev) => {
        previousItemsRef.current = prev;
        return prev.filter((item) => item.savedItemId !== savedItemId);
      });

      try {
        const response = await fetch(`/api/saved-items/${savedItemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const message = await parseApiError(response);
          throw new ApiError(message, response.status);
        }
      } catch (error) {
        setItems(previousItemsRef.current);
        const message = error instanceof ApiError ? error.message : "Nie udało się usunąć zapisanego zdania.";

        if (error instanceof ApiError && error.status === 401) {
          window.location.assign("/login");
          return;
        }

        toast({
          title: "Nie udało się usunąć",
          description: message,
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast]
  );

  return {
    items,
    page,
    hasMore,
    isLoading,
    isFetchingNextPage,
    searchQuery,
    error,
    loadMore,
    deleteItem,
    retry,
    setSearchQuery: updateSearchQuery,
  };
}

async function parseApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.message || data?.error || "Spróbuj ponownie.";
  } catch {
    return "Spróbuj ponownie.";
  }
}

export { useSavedItems };
