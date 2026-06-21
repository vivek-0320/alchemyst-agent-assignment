import { TimelineRow } from '@/lib/sessionType'
import TimelineRowView from './TimelineRowView'
import { useState } from 'react';

interface TimelineProps {
    rows: TimelineRow[];
    highlightedId: string | null;
    onSelect: (id: string) => void;
}

type FilterCategory = "token" | "toolCall" | "context" | "heartbeat" | "error" | "userMessage" | "streamEnd";

const ALL_CATEGORIES: FilterCategory[] = ["token", "toolCall", "context", "heartbeat", "error", "userMessage", "streamEnd"];

const CATEGORY_LABELS: Record<FilterCategory, string> = {
    token: "Tokens",
    toolCall: "Tools",
    context: "Context",
    heartbeat: "Heartbeat",
    error: "Errors",
    userMessage: "User",
    streamEnd: "Stream End",
};

function rowToCategory(kind: TimelineRow["kind"]): FilterCategory {
    switch (kind) {
        case "tokenBatch": return "token";
        case "toolCall": case "toolResult": return "toolCall";
        case "context": return "context";
        case "ping": case "pong": return "heartbeat";
        case "error": return "error";
        case "userMessage": return "userMessage";
        case "streamEnd": return "streamEnd";
    }
}

function rowSearchableText(row: TimelineRow): string {
    switch (row.kind) {
        case "tokenBatch": return row.text;
        case "toolCall": return `${row.toolName} ${JSON.stringify(row.args)}`;
        case "toolResult": return JSON.stringify(row.result);
        case "context": return `${row.contextId} ${JSON.stringify(row.data)}`;
        case "ping": return row.challenge;
        case "pong": return row.echo;
        case "error": return `${row.code} ${row.message}`;
        case "streamEnd": return "";
        case "userMessage": return row.content;
    }
}

const Timeline = ({ rows, highlightedId, onSelect }: TimelineProps) => {
    const [activeKinds, setActiveKinds] = useState<Set<FilterCategory> | null>(null);
    const [searchText, setSearchText] = useState("");

    const isCategoryActive = (cat: FilterCategory) => activeKinds === null || activeKinds.has(cat);

    const toggleCategory = (cat: FilterCategory) => {
        setActiveKinds((prev) => {
            const base = prev ?? new Set(ALL_CATEGORIES);
            const next = new Set(base);
            if (next.has(cat)) {
                next.delete(cat);
            } else {
                next.add(cat);
            }
            return next;
        });
    };

    const filteredRows = rows.filter((row) => {
        const matchesKind = isCategoryActive(rowToCategory(row.kind));
        const matchesSearch = searchText.length === 0 ||
            rowSearchableText(row).toLowerCase().includes(searchText.toLowerCase());
        return matchesKind && matchesSearch;
    });

    return (
        <div className="w-80 shrink-0 border-l border-gray-200 overflow-y-auto h-full bg-gray-50/50 flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500 sticky top-0 bg-gray-50/80 backdrop-blur-sm">
                Agent Trace
            </div>

            <div className="px-3 pt-2 flex flex-wrap gap-1">
                {ALL_CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                            isCategoryActive(cat)
                                ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                                : "bg-gray-100 border-gray-200 text-gray-400"
                        }`}
                    >
                        {CATEGORY_LABELS[cat]}
                    </button>
                ))}
            </div>

            <input
                type="search"
                placeholder="Search trace..."
                value={searchText}
                className="w-full px-3 py-2 mt-2 mx-3 text-sm rounded-lg border border-gray-200 bg-white/90 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                style={{ width: "calc(100% - 1.5rem)" }}
                onChange={(e) => setSearchText(e.target.value)}
            />

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredRows.length === 0 ? (
                    <div className="text-xs text-gray-400 text-center py-6">No matching events</div>
                ) : (
                    filteredRows.map((row) => (
                        <TimelineRowView
                            key={row.id}
                            row={row}
                            isHighlighted={highlightedId === row.id}
                            onSelect={onSelect}
                        />
                    ))
                )}
            </div>
        </div>
    )
}

export default Timeline