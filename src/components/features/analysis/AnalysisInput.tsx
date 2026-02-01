import * as React from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 280;

interface AnalysisInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  error: string | null;
  disabled?: boolean;
  helperText?: string | null;
}

function AnalysisInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  error,
  disabled = false,
  helperText = null,
}: AnalysisInputProps) {
  const length = value.length;
  const isOverLimit = length > MAX_LENGTH;
  const helperId = error || helperText ? "analysis-input-helper" : undefined;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Wpisz tekst po japońsku..."
        disabled={disabled || isLoading}
        className="min-h-[140px] resize-y"
        aria-invalid={Boolean(error) || isOverLimit}
        aria-describedby={helperId}
        data-testid="analysis-input-textarea"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span
          className={cn("transition-colors", isOverLimit ? "text-destructive" : "text-muted-foreground")}
          data-testid="analysis-input-counter"
        >
          {length}/{MAX_LENGTH}
        </span>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={disabled || isLoading || isOverLimit}
          aria-busy={isLoading}
          data-testid="analysis-submit-button"
        >
          {isLoading ? "Analizowanie..." : "Analizuj"}
        </Button>
      </div>
      {error ? (
        <p id={helperId} className="text-destructive text-xs" role="alert" data-testid="analysis-input-error">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-muted-foreground text-xs" data-testid="analysis-input-helper">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

export { AnalysisInput };
