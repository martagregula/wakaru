import type { TokenDTO } from "@/types";

interface TokenDetailProps {
  token: TokenDTO;
}

function TokenDetail({ token }: TokenDetailProps) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <p className="text-xs font-semibold uppercase text-muted-foreground">Oryginał</p>
        <p className="text-base font-semibold">{token.surface}</p>
      </div>
      <div className="space-y-2">
        <DetailRow label="Forma słownikowa" value={token.dictionaryForm ?? "—"} />
        <DetailRow label="Część mowy" value={token.pos} />
        <DetailRow label="Czytanie" value={token.reading} />
        <DetailRow label="Definicja" value={token.definition} />
      </div>
    </div>
  );
}

interface DetailRowProps {
  label: string;
  value: string;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium">{value || "—"}</span>
    </div>
  );
}

export { TokenDetail };
