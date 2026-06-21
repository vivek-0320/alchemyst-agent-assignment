import { TimelineRow } from "@/lib/sessionType";
import TokenBatchRow from "./TokenBatchRow";
import React, { useEffect, useRef } from "react";

const TimelineRowView = React.memo(function TimelineRowView({ row, isHighlighted, onSelect }: {
    row: TimelineRow,
    isHighlighted: boolean;
    onSelect: (id: string) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isHighlighted) {
            ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [isHighlighted]);

    const highlightClass = isHighlighted ? "ring-2 ring-blue-400 bg-blue-50" : "";

    switch (row.kind) {
        case "tokenBatch":
            return (
                <div
                    ref={ref}
                    onClick={() => onSelect(row.id)}
                    className={`cursor-pointer rounded-md px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors ${highlightClass}`}
                >
                    <TokenBatchRow row={row} />
                </div>
            );

        case "toolCall":
            return (
                <div
                    ref={ref}
                    onClick={() => onSelect(row.id)}
                    className={`cursor-pointer rounded-md px-2 py-1.5 text-sm font-mono border-l-2 border-amber-400 bg-white hover:bg-gray-50 transition-colors ${highlightClass}`}
                >
                    <span className="text-amber-700">→</span> {row.toolName}
                </div>
            );

        case "toolResult":
            return (
                <div
                    ref={ref}
                    onClick={() => onSelect(row.callId)}
                    className={`cursor-pointer rounded-md px-2 py-1.5 text-sm font-mono border-l-2 border-emerald-400 bg-white hover:bg-gray-50 transition-colors ${highlightClass}`}
                >
                    <span className="text-emerald-700">←</span> result
                </div>
            );

        case "context":
            return <div ref={ref} className="px-2 py-1.5 text-sm text-gray-600">context: {row.contextId}</div>;
        case "ping":
            return <div ref={ref} className="px-2 py-1.5 text-xs text-gray-400 font-mono">PING {row.challenge || "(corrupt)"}</div>;
        case "pong":
            return <div ref={ref} className="px-2 py-1.5 text-xs text-gray-400 font-mono">PONG {row.echo}</div>;
        case "error":
            return <div ref={ref} className="px-2 py-1.5 text-sm text-red-600">ERROR {row.code}</div>;
        case "streamEnd":
            return <div ref={ref} className="px-2 py-1.5 text-xs text-gray-400 italic">stream ended</div>;
        case "userMessage":
            return <div ref={ref} className="px-2 py-1.5 text-sm font-medium text-gray-800">user: {row.content}</div>;
    }
}, (prev, next) => prev.row === next.row && prev.isHighlighted === next.isHighlighted);

export default TimelineRowView;