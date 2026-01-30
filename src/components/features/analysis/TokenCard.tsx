import type { TokenDTO } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TokenDetail } from "@/components/features/analysis/TokenDetail";
import { cn } from "@/lib/utils";
import { getPosColor } from "@/lib/utils/pos-colors";

interface TokenCardProps {
  token: TokenDTO;
}

function TokenCard({ token }: TokenCardProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex min-h-[56px] items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            getPosColor(token.pos)
          )}
        >
          {token.surface}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <TokenDetail token={token} />
      </PopoverContent>
    </Popover>
  );
}

export { TokenCard };
