import * as React from "react";

import type { AnalysisDTO } from "@/types";
import { SavedAnalysisView } from "@/components/features/analysis/SavedAnalysisView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { ApiError, fetchJson } from "@/lib/utils/api";

interface SavedAnalysisFeatureProps {
  analysisId: string;
}

interface AnalysisResponse {
  analysis: AnalysisDTO;
  savedItemId?: string | null;
}

function SavedAnalysisFeature({ analysisId }: SavedAnalysisFeatureProps) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = React.useState<AnalysisDTO | null>(null);
  const [savedItemId, setSavedItemId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    if (!analysisId) {
      setError("Brak identyfikatora analizy.");
      setIsLoading(false);
      return;
    }

    const abortController = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchJson<AnalysisResponse>(`/api/analyses/${analysisId}`, {
      signal: abortController.signal,
    })
      .then((data) => {
        setAnalysis(data.analysis);
        setSavedItemId(data.savedItemId ?? null);
      })
      .catch((err) => {
        if (err?.name === "AbortError") {
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          window.location.assign("/login");
          return;
        }
        if (err instanceof ApiError && err.status === 404) {
          setError("Analiza nie została znaleziona lub nie masz do niej dostępu.");
          return;
        }
        const message = err instanceof ApiError ? err.message : "Nie udało się pobrać analizy.";
        setError(message);
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [analysisId, refreshKey]);

  const handleRetry = React.useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleCopy = React.useCallback(() => {
    if (!analysis?.translation) {
      toast({
        title: "Brak tłumaczenia",
        description: "Nie ma tłumaczenia do skopiowania.",
      });
      return;
    }

    navigator.clipboard
      .writeText(analysis.translation)
      .then(() => {
        toast({
          title: "Skopiowano",
          description: "Tłumaczenie zostało skopiowane.",
        });
      })
      .catch(() => {
        toast({
          title: "Nie udało się skopiować",
          description: "Spróbuj ponownie.",
          variant: "destructive",
        });
      });
  }, [analysis, toast]);

  const handleDelete = React.useCallback(async () => {
    if (!analysis || isDeleting) {
      return;
    }

    if (!savedItemId) {
      toast({
        title: "Nie można usunąć",
        description: "Brak identyfikatora zapisanego elementu.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    const deleteUrl = `/api/saved-items/${savedItemId}`;

    try {
      const response = await fetch(deleteUrl, { method: "DELETE" });
      if (!response.ok) {
        const message = await parseApiError(response);
        throw new ApiError(message, response.status);
      }

      window.localStorage.setItem("savedItemsToast", "deleted");
      window.location.assign("/saved");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        window.location.assign("/login");
        return;
      }
      const message = err instanceof ApiError ? err.message : "Nie udało się usunąć analizy.";
      toast({
        title: "Nie udało się usunąć",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [analysis, isDeleting, savedItemId, toast]);

  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10" data-feature="saved-analysis">
      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button type="button" variant="outline" onClick={handleRetry}>
              Spróbuj ponownie
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && analysis ? (
        <SavedAnalysisView analysis={analysis} onDelete={handleDelete} onCopy={handleCopy} isDeleting={isDeleting} />
      ) : null}
    </section>
  );
}

async function parseApiError(response: Response) {
  try {
    const data = await response.json();
    return data?.message || data?.error || "Spróbuj ponownie.";
  } catch {
    return "Spróbuj ponownie.";
  }
}

export { SavedAnalysisFeature };
