import { ServerMessage } from "./types";

export class EventLog {
    private highestSeqProcessed: number;

    private expectedSeq: number;

    private pendingBuffer: Map<number, ServerMessage>;

    /**
     * @param startSeq 
     */
    constructor(startSeq: number = 0) {
        this.highestSeqProcessed = startSeq;
        this.expectedSeq = startSeq + 1;
        this.pendingBuffer = new Map();
    }

    ingest(message: ServerMessage): ServerMessage[] {

        if (message.seq <= this.highestSeqProcessed) {
            return [];
        }

        this.pendingBuffer.set(message.seq, message);

        const ready: ServerMessage[] = [];
        while (this.pendingBuffer.has(this.expectedSeq)) {
            const next = this.pendingBuffer.get(this.expectedSeq)!;
            this.pendingBuffer.delete(this.expectedSeq);
            ready.push(next);
            this.highestSeqProcessed = this.expectedSeq;
            this.expectedSeq += 1;
        }

        return ready;
    }

    getResumePoint(): number {
        return this.highestSeqProcessed;
    }

    getBufferedSeqs(): number[] {
        return Array.from(this.pendingBuffer.keys()).sort((a, b) => a - b);
    }

    getExpectedSeq(): number {
        return this.expectedSeq;
    }

    startNewTurn(): void {
        this.highestSeqProcessed = 0;
        this.expectedSeq = 1;
        this.pendingBuffer.clear();
    }

    inspect(): {
        highestSeqProcessed: number;
        expectedSeq: number;
        bufferedSeqs: number[];
    } {
        return {
            highestSeqProcessed: this.highestSeqProcessed,
            expectedSeq: this.expectedSeq,
            bufferedSeqs: this.getBufferedSeqs(),
        };
    }
}