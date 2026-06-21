import { SessionState, TimelineRow, Turn } from "./sessionType";
import { applyTurnEvent } from "./turnReducer";
import { TurnEvent } from "./turnTypes";

type SessionEvent =
    | { kind: "userMessage"; content: string }
    | { kind: "ping"; challenge: string }
    | { kind: "pong"; echo: string }
    | { kind: "context"; contextId: string; data: Record<string, unknown> }
    | { kind: "error"; code: string; message: string }
    | TurnEvent;

export function applySessionEvent(state: SessionState, event: SessionEvent): SessionState {
    const now = Date.now()

    if (event.kind === "ping" || event.kind === "pong" || event.kind === "context" || event.kind === "error") {
        return {
            ...state,
            timeline: (appendOrBatchTimeline(state.timeline, event, now))
        };
    }

    if (event.kind === "userMessage") {
        const sealed = state.currentAgentTurn ? [...state.turns, state.currentAgentTurn] : state.turns;
        return {
            turns: [...sealed, { id: crypto.randomUUID(), role: "user", content: event.content }],
            currentAgentTurn: null,
            timeline: appendOrBatchTimeline(state.timeline, event, now)
        };
    }

    const currentBlocks = state.currentAgentTurn?.blocks ?? [];
    const currentStreamEnded = state.currentAgentTurn?.streamEnded ?? false;
    const innerResult = applyTurnEvent(
        { blocks: currentBlocks, streamEnded: currentStreamEnded },
        event
    );

    const updatedTurn: Turn = {
        id: state.currentAgentTurn?.id ?? crypto.randomUUID(),
        role: "agent",
        blocks: innerResult.blocks,
        streamEnded: innerResult.streamEnded,
    };

    const updatedTimeline = appendOrBatchTimeline(state.timeline, event, now)

    if (innerResult.streamEnded) {
        return {
            turns: [...state.turns, updatedTurn],
            currentAgentTurn: null,
            timeline: updatedTimeline
        };
    }

    return { ...state, currentAgentTurn: updatedTurn, timeline: updatedTimeline };
}

function appendOrBatchTimeline(timeline: TimelineRow[], event: SessionEvent, now: number): TimelineRow[] {
    if (event.kind === "token") {
        const lastRow = timeline[timeline.length - 1]

        if (lastRow && lastRow.kind === "tokenBatch") {
            const updatedBatch: TimelineRow = {
                ...lastRow,
                tokenCount: lastRow.tokenCount + 1,
                text: lastRow.text + event.text,
                lastTokenAt: now
            };
            return [...timeline.slice(0, -1), updatedBatch];
        }
        return [...timeline, {
            kind: "tokenBatch",
            id: crypto.randomUUID(),
            streamId: event.streamId,
            tokenCount: 1,
            text: event.text,
            startedAt: now,
            lastTokenAt: now
        }]
    }
    const id = crypto.randomUUID();
    switch (event.kind) {
        case "toolCall":
            return [...timeline, { kind: "toolCall", id: event.callId, callId: event.callId, toolName: event.toolName, args: event.args, streamId: event.streamId, timestamp: now }];
        case "toolResult":
            return [...timeline, { kind: "toolResult", id, callId: event.callId, result: event.result, timestamp: now }];
        case "context":
            return [...timeline, { kind: "context", id, contextId: event.contextId, data: event.data, timestamp: now }];
        case "ping":
            return [...timeline, { kind: "ping", id, challenge: event.challenge, timestamp: now }];
        case "pong":
            return [...timeline, { kind: "pong", id, echo: event.echo, timestamp: now }];
        case "error":
            return [...timeline, { kind: "error", id, code: event.code, message: event.message, timestamp: now }];
        case "streamEnd":
            return [...timeline, { kind: "streamEnd", id, streamId: event.streamId, timestamp: now }];
        case "userMessage":
            return [...timeline, { kind: "userMessage", id, content: event.content, timestamp: now }];
        default:
            return timeline;
    }
}