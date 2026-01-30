import type { TokenDTO } from "@/types";
import { TokenCard } from "@/components/features/analysis/TokenCard";

interface TokenGridProps {
  tokens: TokenDTO[];
}

function TokenGrid({ tokens }: TokenGridProps) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
      data-feature="token-grid"
      data-token-count={tokens.length}
    >
      {tokens.map((token, index) => (
        <TokenCard key={`${token.surface}-${index}`} token={token} />
      ))}
    </div>
  );
}

export { TokenGrid };
