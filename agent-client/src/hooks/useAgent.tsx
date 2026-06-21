"use client";
import { AgentClient } from '@/lib/client';
import { ConnectionState } from '@/lib/callbacks';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { SessionState } from '@/lib/sessionType';
import { applySessionEvent } from '@/lib/sessionReducer';

const initialSessionState: SessionState = { turns: [], currentAgentTurn: null, timeline: [] };

export default function useAgentClient(url?: string) {
  const clientRef = useRef<AgentClient | null>(null);
  if (clientRef.current === null) {
    clientRef.current = new AgentClient(url);
  }

  const [session, dispatch] = useReducer(applySessionEvent, initialSessionState);
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const toggleHighlight = useCallback((id: string) => {
    setHighlightedId(prev => prev === id ? null : id);
  }, []);

  useEffect(() => {
    const client = clientRef.current!;
    client.connect({
      onToken: (streamId, text) => dispatch({ kind: "token", streamId, text }),
      onToolCall: (callId, toolName, args, streamId) =>
        dispatch({ kind: "toolCall", callId, toolName, args, streamId }),
      onToolResult: (callId, result) => dispatch({ kind: "toolResult", callId, result }),
      onStreamEnd: (streamId) => dispatch({ kind: "streamEnd", streamId }),
      onContext: (contextId, data) => dispatch({ kind: "context", contextId, data }),
      onError: (code, message) => dispatch({ kind: "error", code, message }),
      onConnectionStateChange: setConnectionState,
      onPing: (challenge) => dispatch({ kind: "ping", challenge }),
      onPong: (echo) => dispatch({ kind: "pong", echo })
    });

    return () => client.disconnect();
  }, []);

  const sendMessage = useCallback((content: string) => {
    dispatch({ kind: "userMessage", content });
    clientRef.current?.sendUserMessage(content);
  }, []);

  return {
    turns: session.turns,
    currentAgentTurn: session.currentAgentTurn,
    connectionState,
    sendMessage,
    session,
    highlightedId,
    toggleHighlight
  };
}