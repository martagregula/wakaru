import * as React from "react";

import type { SavedItemWithAnalysisDTO } from "@/types";
import { SavedItemCard } from "@/components/features/saved-items/SavedItemCard";
import { Skeleton } from "@/components/ui/skeleton";

interface SavedItemsListProps {
  items: SavedItemWithAnalysisDTO[];
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onDelete: (id: string) => Promise<void>;
}

function SavedItemsList({ items, isLoadingMore, hasMore, onLoadMore, onDelete }: SavedItemsListProps) {
  return (
    <div className="space-y-6" data-testid="saved-items-list">
      <div className="grid gap-4" aria-live="polite" data-testid="saved-items-grid">
        {items.map((item) => (
          <SavedItemCard key={item.savedItemId} item={item} onDelete={onDelete} />
        ))}
      </div>
      <LoadingSentinel isActive={hasMore} isLoadingMore={isLoadingMore} onLoadMore={onLoadMore} />
    </div>
  );
}

interface LoadingSentinelProps {
  isActive: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

function LoadingSentinel({ isActive, isLoadingMore, onLoadMore }: LoadingSentinelProps) {
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const observerRef = React.useRef<IntersectionObserver | null>(null);

  React.useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!isActive || !sentinelRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observerRef.current = observer;
    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [isActive, isLoadingMore, onLoadMore]);

  if (!isActive && !isLoadingMore) {
    return null;
  }

  return (
    <div ref={sentinelRef} className="flex justify-center py-4">
      {isLoadingMore ? (
        <Skeleton className="h-5 w-24" />
      ) : (
        <span className="text-sm text-muted-foreground">Ładuję...</span>
      )}
    </div>
  );
}

export { SavedItemsList };
