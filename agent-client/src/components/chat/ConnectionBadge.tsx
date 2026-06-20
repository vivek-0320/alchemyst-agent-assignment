import { ConnectionState } from '@/lib/callbacks'
import { Circle } from "lucide-react"

const ConnectionBadge = ({ state }: { state: ConnectionState }) => {
    const stateColors: Record<ConnectionState, string> = {
        idle: "text-gray-500",
        connecting: "text-yellow-500",
        connected: "text-green-500",
        reconnecting: "text-orange-500",
        disconnected: "text-red-500",
    };

    return (
        <div
            className={`fixed top-4 right-4 flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm ${stateColors[state]} animate-pulse `}
        >
            <Circle className="h-3 w-3" fill="currentColor" />
            <span className="capitalize text-gray-700">
                {state}
            </span>
        </div>
    )
}

export default ConnectionBadge