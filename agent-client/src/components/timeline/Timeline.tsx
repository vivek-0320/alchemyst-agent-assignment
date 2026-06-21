import { TimelineRow } from '@/lib/sessionType'
import TimelineRowView from './TimelineRowView'

interface TimelineProps {
    rows: TimelineRow[];
    highlightedId: string | null;
    onSelect: (id: string) => void;
}

const Timeline = ({ rows, highlightedId, onSelect }: TimelineProps) => {
    return (
        <div className="w-80 shrink-0 border-l border-gray-200 overflow-y-auto h-full bg-gray-50/50 flex flex-col">
            <div className="px-3 py-2 border-b border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-500 sticky top-0 bg-gray-50/80 backdrop-blur-sm">
                Agent Trace
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {rows.map(row =>
                    <div key={row.id} className='border-b p-1 bg-gray-300'>
                        <TimelineRowView row={row} isHighlighted={highlightedId === row.id} onSelect={onSelect} />
                    </div>)}
            </div>
        </div>
    )
}

export default Timeline
