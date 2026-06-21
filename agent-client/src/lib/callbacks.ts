export type ConnectionState =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface AgentClientCallbacks {
  onToken: (streamId: string, text: string) => void;
  onStreamEnd: (streamId: string, fullText: string) => void;
  onToolCall: (
    callId: string,
    toolName: string,
    args: Record<string, unknown>,
    streamId: string,
    precedingText: string
  ) => void;

  onPing : (challenge: string) => void

  onPong : (echo : string) => void

  onToolResult: (callId: string, result: Record<string, unknown>) => void;

  onContext: (contextId: string, data: Record<string, unknown>) => void;

  onError: (code: string, message: string) => void;

  onConnectionStateChange: (state: ConnectionState) => void;
}