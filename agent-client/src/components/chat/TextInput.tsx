'use client'
import { useState, FormEvent } from 'react'
import { ConnectionState } from '@/lib/callbacks';

interface ChildProps {
    sendMessage: (msg: string) => void
    connectionState: ConnectionState
}

const TextInput = ({ sendMessage, connectionState }: ChildProps) => {
    const [userText, setUserText] = useState("");

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!userText.trim()) return;

        sendMessage(userText.trim());

        setUserText("")
    }

    return (
        <div className='w-full bg-white p-4 pb-8 border-t-2'>
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                <input
                    type="text"
                    value={userText}
                    onChange={(e) => setUserText(e.target.value)}
                    placeholder={connectionState === "connected" ? "Message..." : "Connecting..."}
                    className="flex-1 rounded-full bg-gray-100 px-5 py-3 text-gray-900 outline-none focus:bg-gray-200 transition-colors"
                    autoComplete="off"
                />
                <button
                    type="submit"
                    disabled={!userText.trim() || connectionState !== "connected"}
                    className="rounded-full bg-blue-500 text-white px-6 py-3 font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    Send
                </button>
            </form>
        </div>
    )
}

export default TextInput
