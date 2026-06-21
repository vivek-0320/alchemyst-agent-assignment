'use client'

import ChatPanel from "@/components/chat/ChatPanel";
import Navbar from "@/components/Navbar";
import Timeline from "@/components/timeline/Timeline";
import useAgentClient from '@/hooks/useAgent';

export default function Home() {
  const agentClient = useAgentClient();

  return (
    <div className="h-screen bg-white flex flex-col font-sans">
      <Navbar connectionState={agentClient.connectionState} />
      <div className="flex-1 min-h-0 flex">
        <ChatPanel agentClient={agentClient} />
        <Timeline
          rows={agentClient.session.timeline}
          highlightedId={agentClient.highlightedId}
          onSelect={agentClient.toggleHighlight}
        />
      </div>
    </div>
  );
}