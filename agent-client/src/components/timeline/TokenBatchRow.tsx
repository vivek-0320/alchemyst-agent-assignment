import { TimelineRow } from '@/lib/sessionType';
import { useState } from 'react'

const TokenBatchRow = ({ row }: { row: TimelineRow }) => {
    if (row.kind === "tokenBatch") {
        const [expanded, setExpanded] = useState(false);
        const seconds = ((row.lastTokenAt - row.startedAt) / 1000).toFixed(1);

        return (
            <div onClick={() => setExpanded(e => !e)} >
                <div>Streamed {row.tokenCount} tokens in {seconds}s</div>
                {expanded && <div className='text-xs mt-1 opacity-70' >{row.text}</div>}
            </div>
        )
    }
}

export default TokenBatchRow
