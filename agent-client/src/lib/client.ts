import {
  ServerMessage,
  ClientMessage,
  TokenMessage,
  ContextSnapshotMessage,
  StreamEndMessage,
  ToolCallMessage,
  ToolResultMessage,
  ErrorMessage,
} from "@/lib/types";
import { EventLog } from "@/lib/eventLog";
import { AgentClientCallbacks, ConnectionState } from "@/lib/callbacks";

const BACKOFF_SCHEDULE_MS = [500, 1000, 2000, 4000];
const BACKOFF_CAP_MS = 10000;

export class AgentClient {
  private socket: WebSocket | null = null;
  private url: string;
  private callbacks!: AgentClientCallbacks;

  private eventLog: EventLog;

  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt: number = 0;
  private intentionalDisconnect: boolean = false;
  private connectionState: ConnectionState = "idle";

  constructor(url: string = "ws://127.0.0.1:4747/ws") {
    this.url = url;
    this.eventLog = new EventLog(0);
  }

  public connect(callbacks: AgentClientCallbacks): void {
    this.callbacks = callbacks;
    this.intentionalDisconnect = false;
    this.openSocket(false);
  }

  public disconnect(): void {
    this.intentionalDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    const socket = this.socket;
    this.socket = null;
    if (socket) {
      socket.close(1000, "client disconnect");
    }
    this.setConnectionState("disconnected");
  }

  public sendUserMessage(content: string): void {
    this.eventLog.startNewTurn();
    this.send({ type: "USER_MESSAGE", content });
  }

  public sendToolAck(callId: string): void {
    this.send({ type: "TOOL_ACK", call_id: callId });
  }

  public getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  private openSocket(isReconnect: boolean): void {
    this.setConnectionState(isReconnect ? "reconnecting" : "connecting");
    const socket = new WebSocket(this.url);
    this.socket = socket;

    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.reconnectAttempt = 0;
      this.setConnectionState("connected");

      if (isReconnect) {
        const resumePoint = this.eventLog.getResumePoint();
        this.send({ type: "RESUME", last_seq: resumePoint });
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      if (this.socket !== socket) return;
      this.handleRawMessage(event);
    };

    socket.onerror = (event: Event) => {
      if (this.socket !== socket) return;
      console.log("[AgentClient] WebSocket error", event);
    };

    socket.onclose = (event: CloseEvent) => {
      if (this.socket !== socket) return;

      this.socket = null;
      if (this.intentionalDisconnect) {
        this.setConnectionState("disconnected");
        return;
      }

      console.log(
        `[AgentClient] Closed (code=${event.code}, reason="${event.reason}"). Scheduling reconnect.`
      );
      this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    this.setConnectionState("reconnecting");

    const delay = BACKOFF_SCHEDULE_MS[this.reconnectAttempt] ?? BACKOFF_CAP_MS;
    this.reconnectAttempt += 1;

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.openSocket(true);
    }, delay);
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.callbacks?.onConnectionStateChange(state);
  }

  private send(message: ClientMessage): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn("[AgentClient] Dropped send, socket not open:", message);
    }
  }

  private handleRawMessage(event: MessageEvent): void {
    let message: ServerMessage;
    try {
      message = JSON.parse(event.data) as ServerMessage;
    } catch {
      console.error("[AgentClient] Failed to parse message:", event.data);
      return;
    }

    const readyMessages = this.eventLog.ingest(message);
    for (const orderedMessage of readyMessages) {
      this.dispatchMessage(orderedMessage);
    }
  }

  private dispatchMessage(message: ServerMessage): void {
    switch (message.type) {
      case "PING":
        this.handlePing(message.challenge);
        break;
      case "CONTEXT_SNAPSHOT":
        this.handleContext(message);
        break;
      case "TOKEN":
        this.handleToken(message);
        break;
      case "STREAM_END":
        this.handleStreamEnd(message);
        break;
      case "TOOL_CALL":
        this.handleToolCall(message);
        break;
      case "TOOL_RESULT":
        this.handleToolResult(message);
        break;
      case "ERROR":
        this.handleError(message);
        break;
      default:
        console.warn("[AgentClient] Unhandled message type:", message);
    }
  }

  private handlePing(challenge: string): void {
    this.callbacks.onPing(challenge);
    this.send({ type: "PONG", echo: challenge });
    this.callbacks.onPong(challenge);
  }

  private handleContext(message: ContextSnapshotMessage): void {
    this.callbacks.onContext(message.context_id, message.data);
  }

  private handleToken(message: TokenMessage): void {
    this.callbacks.onToken(message.stream_id, message.text);
  }

  private handleStreamEnd(message: StreamEndMessage): void {
    this.callbacks.onStreamEnd(message.stream_id);
  }

  private handleToolCall(message: ToolCallMessage): void {
    this.callbacks.onToolCall(
      message.call_id,
      message.tool_name,
      message.args,
      message.stream_id
    );
    this.sendToolAck(message.call_id);
  }

  private handleToolResult(message: ToolResultMessage): void {
    this.callbacks.onToolResult(message.call_id, message.result);
  }

  private handleError(message: ErrorMessage): void {
    this.callbacks.onError(message.code, message.message);
  }
}