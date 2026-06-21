export type TurnEvent =
  | { kind: "token"; streamId: string; text: string }
  | {
      kind: "toolCall";
      callId: string;
      toolName: string;
      args: Record<string, unknown>;
      streamId: string;
    }
  | { kind: "toolResult"; callId: string; result: Record<string, unknown> }
  | { kind: "streamEnd"; streamId: string };

export interface TextBlock {
  id: string;
  type: "text";
  content: string;
}

export interface ToolBlock {
  id: string;
  type: "tool";
  callId: string;
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown> | null;
  status: "pending" | "complete";
}

export type Block = TextBlock | ToolBlock;

export interface TurnState {
  blocks: Block[];
  streamEnded: boolean;
}

export const initialTurnState: TurnState = { blocks: [], streamEnded: false };