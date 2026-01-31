interface TranslationBlockProps {
  translation: string | null;
}

function TranslationBlock({ translation }: TranslationBlockProps) {
  return (
    <div className="space-y-2" data-feature="translation-block" data-testid="analysis-translation-block">
      <p className="text-xs font-semibold uppercase text-muted-foreground">Tłumaczenie</p>
      <p className="rounded-lg border bg-muted/30 px-4 py-3 text-sm" data-testid="analysis-translation-text">
        {translation ?? "—"}
      </p>
    </div>
  );
}

export { TranslationBlock };
