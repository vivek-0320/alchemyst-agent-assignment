'use client'
import { useState, useRef, useEffect } from 'react';
import useAgentClient from '@/hooks/useAgent'
import ConnectionBadge from './ConnectionBadge';
import TextBlock from './TextBlock';
import ToolCallCard from './ToolCallCard';
import TextInput from './TextInput';
import { Block } from '@/lib/turnTypes';

type HistoryItem = 
  | { role: 'user'; content: string }
  | { role: 'agent'; blocks: Block[] };

import Navbar from '../Navbar';

const ChatPanel = () => {
    const agentClient = useAgentClient();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, agentClient.blocks]);

    const handleSendMessage = (text: string) => {
        setHistory(prev => {
            const newHistory = [...prev];
            if (agentClient.blocks.length > 0) {
                newHistory.push({ role: 'agent', blocks: agentClient.blocks });
            }
            newHistory.push({ role: 'user', content: text });
            return newHistory;
        });
        agentClient.sendMessage(text);
    };

    return (
        <div className="h-screen bg-white flex flex-col font-sans">
            <Navbar connectionState={agentClient.connectionState} />

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 w-full max-w-3xl mx-auto py-6">
                {history.map((item, idx) => (
                    <div key={idx} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${item.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
                            {item.role === 'user' ? (
                                <p>{item.content}</p>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {item.blocks.map((block, i) => 
                                        block.type === "text" 
                                            ? <TextBlock key={block.id || i} content={block.content} />
                                            : <ToolCallCard key={block.id || i} toolBlock={block} />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {agentClient.blocks.length > 0 && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] rounded-2xl px-5 py-3 bg-gray-100 text-gray-900">
                            <div className="flex flex-col gap-3">
                                {agentClient.blocks.map((block, i) => 
                                    block.type === "text" 
                                        ? <TextBlock key={block.id || i} content={block.content} />
                                        : <ToolCallCard key={block.id || i} toolBlock={block} />
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={endOfMessagesRef} />
            </div>

            <TextInput sendMessage={handleSendMessage} connectionState={agentClient.connectionState} />
        </div>
    )
}

export default ChatPanel;
