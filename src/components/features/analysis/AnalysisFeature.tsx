import * as React from "react";

import type { AnalysisDTO, CreateAnalysisCommand, CreateAnalysisResponseDTO, SaveItemCommand } from "@/types";
import { AnalysisInput } from "@/components/features/analysis/AnalysisInput";
import { AnalysisResult } from "@/components/features/analysis/AnalysisResult";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface AnalysisFeatureProps {
  isLoggedIn: boolean;
}

const MAX_LENGTH = 280;
const LENGTH_ERROR = "Tekst jest za długi (max 280 znaków).";
const JAPANESE_REGEX = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/;

function AnalysisFeature({ isLoggedIn }: AnalysisFeatureProps) {
  const { toast } = useToast();
  const [inputText, setInputText] = React.useState("");
  const [analysis, setAnalysis] = React.useState<AnalysisDTO | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  const validateInput = React.useCallback((value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return "Wpisz tekst, aby rozpocząć analizę.";
    }
    if (value.length > MAX_LENGTH) {
      return LENGTH_ERROR;
    }
    if (!JAPANESE_REGEX.test(value)) {
      return "Wprowadź tekst zawierający znaki japońskie.";
    }
    return null;
  }, []);

  const handleChange = React.useCallback(
    (value: string) => {
      setInputText(value);
      if (value.length > MAX_LENGTH) {
        setValidationError(LENGTH_ERROR);
        return;
      }
      if (validationError === LENGTH_ERROR) {
        setValidationError(null);
        return;
      }
      if (validationError) {
        const trimmed = value.trim();
        if (trimmed && JAPANESE_REGEX.test(value)) {
          setValidationError(null);
        }
      }
    },
    [validationError]
  );

  const handleAnalyze = React.useCallback(async () => {
    if (isLoading) {
      return;
    }
    if (!isLoggedIn) {
      toast({
        title: "Wymagane logowanie",
        description: "Zaloguj się, aby analizować tekst.",
      });
      return;
    }

    const error = validateInput(inputText);
    if (error) {
      setValidationError(error);
      return;
    }

    setAnalysis(null);
    setSaveStatus("idle");
    setIsLoading(true);
    setValidationError(null);

    try {
      const payload: CreateAnalysisCommand = {
        originalText: inputText.trim(),
      };

      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await parseApiError(response);

        if (response.status === 400) {
          setValidationError(message);
        } else if (response.status === 401) {
          toast({
            title: "Wymagane logowanie",
            description: "Zaloguj się, aby analizować tekst.",
          });
        } else if (response.status === 429) {
          toast({
            title: "Zbyt wiele żądań",
            description: "Spróbuj ponownie za chwilę.",
          });
        } else {
          toast({
            title: "Coś poszło nie tak",
            description: message,
            variant: "destructive",
          });
        }
        return;
      }

      const data: CreateAnalysisResponseDTO = await response.json();
      setAnalysis(data.analysis);
      setSaveStatus("idle");
    } catch (error) {
      console.error("Analysis request failed", error);
      toast({
        title: "Błąd sieci",
        description: "Nie udało się połączyć z serwerem.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoggedIn, toast, validateInput]);

  const handleSave = React.useCallback(async () => {
    if (!analysis) {
      return;
    }

    if (saveStatus === "saving") {
      return;
    }

    if (!isLoggedIn) {
      toast({
        title: "Wymagane logowanie",
        description: "Zaloguj się, aby zapisać analizę.",
      });
      return;
    }

    setSaveStatus("saving");

    try {
      const payload: SaveItemCommand = { analysisId: analysis.id };
      const response = await fetch("/api/saved-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const message = await parseApiError(response);

        if (response.status === 409) {
          setSaveStatus("saved");
          toast({
            title: "Już zapisane",
            description: "Ta analiza jest już w Twojej bibliotece.",
          });
          return;
        }

        if (response.status === 401) {
          toast({
            title: "Wymagane logowanie",
            description: "Zaloguj się, aby zapisać analizę.",
          });
        } else if (response.status === 404) {
          toast({
            title: "Nie znaleziono analizy",
            description: message,
          });
        } else {
          toast({
            title: "Nie udało się zapisać",
            description: message,
            variant: "destructive",
          });
        }
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");
      toast({
        title: "Zapisano w bibliotece",
        description: "Możesz wrócić do tej analizy później.",
      });
    } catch (error) {
      console.error("Save request failed", error);
      setSaveStatus("error");
      toast({
        title: "Błąd sieci",
        description: "Nie udało się zapisać analizy.",
        variant: "destructive",
      });
    }
  }, [analysis, isLoggedIn, saveStatus, toast]);

  const handleCopyTranslation = React.useCallback(() => {
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
      .catch((error) => {
        console.error("Copy failed", error);
        toast({
          title: "Nie udało się skopiować",
          description: "Spróbuj ponownie.",
          variant: "destructive",
        });
      });
  }, [analysis, toast]);

  return (
    <section
      className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10"
      data-feature="analysis"
      data-logged-in={isLoggedIn}
      data-hydrated={isHydrated ? "true" : "false"}
      data-testid="analysis-feature"
    >
      <Card>
        <CardHeader>
          <CardTitle>Analiza tekstu</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalysisInput
            value={inputText}
            onChange={handleChange}
            onSubmit={handleAnalyze}
            isLoading={isLoading}
            error={validationError}
            helperText={!isLoggedIn ? "Zaloguj się, aby korzystać z analizy." : null}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-3">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ) : null}

      {analysis ? (
        <AnalysisResult
          analysis={analysis}
          onSave={handleSave}
          onCopyTranslation={handleCopyTranslation}
          isSaving={saveStatus === "saving"}
          isSaved={saveStatus === "saved"}
          isLoggedIn={isLoggedIn}
        />
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

export { AnalysisFeature };
