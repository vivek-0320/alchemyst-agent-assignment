import { Block } from "./turnTypes";

export interface Turn {
    id: string;
    role: "user" | "agent";
    content?: string;
    blocks?: Block[];
    streamEnded?: boolean;
}

export interface SessionState {
    turns: Turn[];
    currentAgentTurn: Turn | null;
    timeline: TimelineRow[];
}

export type TimelineRow =
    | { kind: "tokenBatch"; id: string; streamId: string; tokenCount: number; text: string; startedAt: number; lastTokenAt: number }
    | { kind: "toolCall"; id: string; callId: string; toolName: string; args: Record<string, unknown>; streamId: string; timestamp: number }
    | { kind: "toolResult"; id: string; callId: string; result: Record<string, unknown>; timestamp: number }
    | { kind: "context"; id: string; contextId: string; data: Record<string, unknown>; timestamp: number }
    | { kind: "ping"; id: string; challenge: string; timestamp: number }
    | { kind: "pong"; id: string; echo: string; timestamp: number }
    | { kind: "error"; id: string; code: string; message: string; timestamp: number }
    | { kind: "streamEnd"; id: string; streamId: string; timestamp: number }
    | { kind: "userMessage"; id: string; content: string; timestamp: number };