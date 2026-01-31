import * as React from "react";

import type { PaginatedSavedItemsDTO, SavedItemWithAnalysisDTO } from "@/types";
import { useToast } from "@/components/ui/use-toast";
import { ApiError, fetchJson } from "@/lib/utils/api";

const PAGE_SIZE = 20;

function useSavedItems() {
  const { toast } = useToast();
  const [items, setItems] = React.useState<SavedItemWithAnalysisDTO[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [fetchKey, setFetchKey] = React.useState(0);
  const previousItemsRef = React.useRef<SavedItemWithAnalysisDTO[]>([]);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const isFirstPage = page === 1;
    if (isFirstPage) {
      setIsLoading(true);
    } else {
      setIsFetchingNextPage(true);
    }
    setError(null);

    fetchJson<PaginatedSavedItemsDTO>("/api/saved-items", {
      params: {
        page,
        pageSize: PAGE_SIZE,
        q: searchQuery,
        sort: "savedAt",
        order: "desc",
      },
      signal: abortController.signal,
    })
      .then((data) => {
        // Ignore result if this request was superseded by a newer one
        if (abortControllerRef.current !== abortController) return;

        setItems((prev) => {
          const nextItems = isFirstPage ? data.items : [...prev, ...data.items];
          const moreAvailable = data.total > nextItems.length;
          setHasMore(moreAvailable);
          return nextItems;
        });
      })
      .catch((err) => {
        // Ignore errors from aborted requests
        if (err.name === "AbortError") return;
        if (abortControllerRef.current !== abortController) return;

        if (err instanceof ApiError && err.status === 401) {
          window.location.assign("/login");
          return;
        }
        const message = err instanceof ApiError ? err.message : "Nie udało się pobrać zapisanych zdań.";
        setError(message);
        setHasMore(false);
      })
      .finally(() => {
        if (abortControllerRef.current !== abortController) return;
        setIsLoading(false);
        setIsFetchingNextPage(false);
      });

    return () => {
      abortController.abort();
    };
  }, [page, searchQuery, fetchKey]);

  const loadMore = React.useCallback(() => {
    if (isLoading || isFetchingNextPage || !hasMore || error) {
      return;
    }
    setPage((prev) => prev + 1);
  }, [error, hasMore, isFetchingNextPage, isLoading]);

  const updateSearchQuery = React.useCallback((query: string) => {
    setSearchQuery(query);
    setItems([]);
    setPage(1);
    setHasMore(false);
    setError(null);
  }, []);

  const retry = React.useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(false);
    setError(null);
    setFetchKey((k) => k + 1);
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
