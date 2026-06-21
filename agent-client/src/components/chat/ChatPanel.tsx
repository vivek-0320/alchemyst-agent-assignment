'use client'
import { useRef, useEffect } from 'react';
import useAgentClient from '@/hooks/useAgent'
import TextBlock from './TextBlock';
import ToolCallCard from './ToolCallCard';
import TextInput from './TextInput';

interface ChatPanelProps {
    agentClient: ReturnType<typeof useAgentClient>;
}

const ChatPanel = ({ agentClient }: ChatPanelProps) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [agentClient.turns, agentClient.currentAgentTurn]);

    return (
        <div className="flex-1 min-h-0 bg-white flex flex-col font-sans">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 w-full mx-auto py-6">
                {agentClient.turns.map((item) => (
                    <div key={item.id} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${item.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                            {item.role === 'user' ? (
                                <p>{item.content}</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {item.blocks?.map((block, i) =>
                                        block.type === "text"
                                            ? <TextBlock key={block.id || i} content={block.content} />
                                            : <ToolCallCard
                                                key={block.id || i}
                                                toolBlock={block}
                                                isHighlighted={agentClient.highlightedId === block.id}
                                                onSelect={agentClient.toggleHighlight}
                                              />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {agentClient.currentAgentTurn && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl px-5 py-3 bg-gray-100 text-gray-900">
                            <div className="flex flex-col gap-3">
                                {agentClient.currentAgentTurn.blocks?.map((block, i) =>
                                    block.type === "text"
                                        ? <TextBlock key={block.id || i} content={block.content} />
                                        : <ToolCallCard
                                            key={block.id || i}
                                            toolBlock={block}
                                            isHighlighted={agentClient.highlightedId === block.id}
                                            onSelect={agentClient.toggleHighlight}
                                          />
                                )}
                                {!agentClient.currentAgentTurn.streamEnded && (
                                    <div className="flex items-center gap-1.5 py-1">
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            <TextInput sendMessage={agentClient.sendMessage} connectionState={agentClient.connectionState} />
        </div>
    )
}

export default ChatPanel;