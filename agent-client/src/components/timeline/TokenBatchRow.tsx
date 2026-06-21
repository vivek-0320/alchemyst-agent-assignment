import { useState } from "react";
import { TimelineRow } from "@/lib/sessionType";

interface TokenBatchRowProps {
  row: Extract<TimelineRow, { kind: "tokenBatch" }>;
}

export default function TokenBatchRow({ row }: TokenBatchRowProps) {
  const [expanded, setExpanded] = useState(false);
  const seconds = ((row.lastTokenAt - row.startedAt) / 1000).toFixed(1);

  return (
    <div>
      <div
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((x) => !x);
        }}
        className="cursor-pointer"
      >
        Streamed {row.tokenCount} tokens ({seconds}s)
      </div>
      {expanded && (
        <div className="text-xs mt-1 opacity-70 whitespace-pre-wrap">{row.text}</div>
      )}
    </div>
  );
}