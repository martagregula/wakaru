import * as React from "react";
import { Trash2 } from "lucide-react";

import type { SavedItemWithAnalysisDTO } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface SavedItemCardProps {
  item: SavedItemWithAnalysisDTO;
  onDelete: (id: string) => void | Promise<void>;
}

function SavedItemCard({ item, onDelete }: SavedItemCardProps) {
  const relativeSavedAt = React.useMemo(() => formatRelativeTime(item.savedAt), [item.savedAt]);
  const absoluteSavedAt = React.useMemo(() => formatAbsoluteTime(item.savedAt), [item.savedAt]);

  const handleNavigate = React.useCallback(() => {
    window.location.assign(`/analysis/${item.analysis.id}`);
  }, [item.analysis.id]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleNavigate();
      }
    },
    [handleNavigate]
  );

  const handleDelete = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      void onDelete(item.savedItemId);
    },
    [item.savedItemId, onDelete]
  );

  return (
    <Card
      className="cursor-pointer transition hover:border-primary/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      role="button"
      tabIndex={0}
      onClick={handleNavigate}
      onKeyDown={handleKeyDown}
      data-saved-item-id={item.savedItemId}
    >
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Zdanie</p>
            <p className="text-lg font-medium text-foreground">{item.analysis.originalText}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            aria-label="Usuń zapisane zdanie"
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground">Tłumaczenie</p>
          <p className="text-sm text-foreground">{item.analysis.translation ?? "Brak tłumaczenia"}</p>
        </div>
      </CardContent>
      <CardFooter className="justify-between text-xs text-muted-foreground">
        <span title={absoluteSavedAt}>Dodano {relativeSavedAt}</span>
      </CardFooter>
    </Card>
  );
}

function formatRelativeTime(isoDate: string) {
  const date = new Date(isoDate);
  const now = new Date();
  const diffInSeconds = Math.round((date.getTime() - now.getTime()) / 1000);

  const divisions = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.34524, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Number.POSITIVE_INFINITY, unit: "year" },
  ] as const;

  let duration = diffInSeconds;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      return new Intl.RelativeTimeFormat("pl", { numeric: "auto" }).format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return "przed chwilą";
}

function formatAbsoluteTime(isoDate: string) {
  const date = new Date(isoDate);
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export { SavedItemCard };
