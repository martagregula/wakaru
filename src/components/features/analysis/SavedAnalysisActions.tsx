import { Button } from "@/components/ui/button";

interface SavedAnalysisActionsProps {
  onDelete: () => void;
  onCopy: () => void;
  isDeleting: boolean;
  translation: string | null;
}

function SavedAnalysisActions({ onDelete, onCopy, isDeleting, translation }: SavedAnalysisActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3" data-feature="saved-analysis-actions">
      <Button type="button" variant="outline" onClick={onCopy} disabled={!translation}>
        Kopiuj tłumaczenie
      </Button>
      <Button type="button" variant="destructive" onClick={onDelete} disabled={isDeleting} aria-busy={isDeleting}>
        {isDeleting ? "Usuwanie..." : "Usuń"}
      </Button>
    </div>
  );
}

export { SavedAnalysisActions };
