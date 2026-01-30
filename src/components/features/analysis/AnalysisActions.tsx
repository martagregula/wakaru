import { Button } from "@/components/ui/button";

interface AnalysisActionsProps {
  onSave: () => void;
  onCopyTranslation: () => void;
  isSaving: boolean;
  isSaved: boolean;
  translation: string | null;
  isLoggedIn: boolean;
}

function AnalysisActions({
  onSave,
  onCopyTranslation,
  isSaving,
  isSaved,
  translation,
  isLoggedIn,
}: AnalysisActionsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3" data-feature="analysis-actions">
      <Button type="button" onClick={onSave} disabled={!isLoggedIn || isSaving || isSaved} aria-busy={isSaving}>
        {isSaved ? "Zapisano" : isSaving ? "Zapisywanie..." : "Zapisz"}
      </Button>
      <Button type="button" variant="outline" onClick={onCopyTranslation} disabled={!translation}>
        Kopiuj tłumaczenie
      </Button>
    </div>
  );
}

export { AnalysisActions };
