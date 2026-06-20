"use client";
import { AgentClient } from '@/lib/client';
import { ConnectionState } from '@/lib/callbacks';
import { applyTurnEvent } from '@/lib/turnReducer';
import { TurnState } from '@/lib/turnTypes';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

const initialTurnState: TurnState = { blocks: [], streamEnded: false };

export default function useAgentClient(url?: string) {
  const clientRef = useRef<AgentClient | null>(null);
  if (clientRef.current === null) {
    clientRef.current = new AgentClient(url);
  }

  const [turnState, dispatch] = useReducer(applyTurnEvent, initialTurnState);
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");

  useEffect(() => {
    const client = clientRef.current!;
    client.connect({
      onToken: (streamId, text) => dispatch({ kind: "token", streamId, text }),
      onToolCall: (callId, toolName, args, streamId) =>
        dispatch({ kind: "toolCall", callId, toolName, args, streamId }),
      onToolResult: (callId, result) => dispatch({ kind: "toolResult", callId, result }),
      onStreamEnd: (streamId) => dispatch({ kind: "streamEnd", streamId }),
      onContext: () => { },
      onError: (code, message) => console.error(`[agent error] ${code}: ${message}`),
      onConnectionStateChange: setConnectionState,
    });

    return () => client.disconnect();
  }, []);

  const sendMessage = useCallback((content: string) => {
    dispatch({ kind: "reset" });
    clientRef.current?.sendUserMessage(content);
  }, []);

  return {
    blocks: turnState.blocks,
    streamEnded: turnState.streamEnded,
    connectionState,
    sendMessage,
  };
}
