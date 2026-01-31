import type { AnalysisDTO } from "@/types";
import { SavedAnalysisActions } from "@/components/features/analysis/SavedAnalysisActions";
import { TokenGrid } from "@/components/features/analysis/TokenGrid";
import { TranslationBlock } from "@/components/features/analysis/TranslationBlock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SavedAnalysisViewProps {
  analysis: AnalysisDTO;
  onDelete: () => void;
  onCopy: () => void;
  isDeleting: boolean;
}

function SavedAnalysisView({ analysis, onDelete, onCopy, isDeleting }: SavedAnalysisViewProps) {
  return (
    <Card data-feature="saved-analysis-view" data-analysis-id={analysis.id}>
      <CardHeader>
        <CardTitle>Wyniki analizy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Poziom</p>
            <p className="font-medium">{analysis.data.difficulty}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Romaji</p>
            <p className="font-medium">{analysis.data.romaji}</p>
          </div>
        </div>
        <TokenGrid tokens={analysis.data.tokens} />
        <TranslationBlock translation={analysis.translation} />
        <SavedAnalysisActions
          onDelete={onDelete}
          onCopy={onCopy}
          isDeleting={isDeleting}
          translation={analysis.translation}
        />
      </CardContent>
    </Card>
  );
}

export { SavedAnalysisView };
