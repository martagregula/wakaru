import type { AnalysisDTO } from "@/types";
import { AnalysisActions } from "@/components/features/analysis/AnalysisActions";
import { TokenGrid } from "@/components/features/analysis/TokenGrid";
import { TranslationBlock } from "@/components/features/analysis/TranslationBlock";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AnalysisResultProps {
  analysis: AnalysisDTO;
  onSave: () => Promise<void>;
  onCopyTranslation: () => void;
  isSaving: boolean;
  isSaved: boolean;
  isLoggedIn: boolean;
}

function AnalysisResult({ analysis, onSave, onCopyTranslation, isSaving, isSaved, isLoggedIn }: AnalysisResultProps) {
  return (
    <Card data-feature="analysis-result" data-analysis-id={analysis.id}>
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
        <AnalysisActions
          onSave={onSave}
          onCopyTranslation={onCopyTranslation}
          isSaving={isSaving}
          isSaved={isSaved}
          translation={analysis.translation}
          isLoggedIn={isLoggedIn}
        />
      </CardContent>
    </Card>
  );
}

export { AnalysisResult };
