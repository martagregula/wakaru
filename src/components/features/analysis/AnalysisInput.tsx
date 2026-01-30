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
  noticeText?: string | null;
}

function AnalysisInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  error,
  disabled = false,
  helperText = null,
  noticeText = null,
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
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={cn("transition-colors", isOverLimit ? "text-destructive" : "text-muted-foreground")}>
          {length}/{MAX_LENGTH}
        </span>
        <Button type="button" onClick={onSubmit} disabled={disabled || isLoading || isOverLimit} aria-busy={isLoading}>
          {isLoading ? "Analizowanie..." : "Analizuj"}
        </Button>
      </div>
      {error ? (
        <p id={helperId} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-muted-foreground text-xs">
          {helperText}
        </p>
      ) : null}
      {noticeText ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {noticeText}
        </div>
      ) : null}
    </div>
  );
}

export { AnalysisInput };
