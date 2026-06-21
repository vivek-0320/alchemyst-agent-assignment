# Decisions

## Seq-based ordering and deduplication

**Data structure:** a `Map<number, ServerMessage>` as a pending buffer, plus two watermarks: `highestSeqProcessed` (last seq actually processed) and `expectedSeq` (`highestSeqProcessed + 1`, the seq we're waiting on). This lives in its own class, `EventLog`, which knows nothing about WebSockets or React. Its only job: given an incoming message, what is now safe to process, in order, with no duplicates?
I used Map not PriorityQueue because seq numbers are sparse and bounded (one turn rarely has more than a few dozen messages), so a Map keyed by seq gives O(1) insert and O(1) lookups. A priority queue would add log(n) overhead for sorted order, which we never actually need, we only ever look up one specific key (`expectedSeq`) at a time.

**Algorithm:** on `ingest(message)`, anything with `seq <= highestSeqProcessed` is dropped right away. This is deduping of messages, and it happens before the message touches the buffer, so even a duplicate from long ago (e.g. after a reconnect replay overlaps with live traffic) gets rejected. Otherwise the message goes into the buffer, then a drain loop checks "is `expectedSeq` in the buffer now?" If yes, remove it, push to results, bump both watermarks, repeat. This is how "seq 15 before seq 14" gets handled correctly: 15 just sits in the buffer until 14 shows up, then both drain together in one `ingest()` call.

---
## Preventing layout shift during tool call interruptions

A turn is never rendered as raw streaming text. It's an ordered array of immutable `Block` objects (`turnReducer.ts`), either `{type: "text", content}` or `{type: "tool", status, args, result}`. A token either appends to the last block (if it's text) or starts a new block (if the last one was a tool, or there's nothing yet). A tool call always pushes a new block and never touches earlier ones. So a tool call interrupting a stream isn't a re-render with something spliced in, it's a pure append, and every earlier block keeps the exact same object reference it had before.

That reference stability is the actual fix for layout shift. Each block renders as its own component (`TextBlock` / `ToolCallCard`), keyed by a stable id (`block.id`, never array index), so React only mounts the new block and never touches anything above it. No CSS tricks, no fixed heights, no absolute positioning. The discipline is all in the data layer: never mutate, never recreate objects that didn't change, key lists by real identity not position.

---
## Reconnection and state recovery: consumed vs received

The key rule: `EventLog.highestSeqProcessed` only moves forward once a message is actually pulled out of the buffer and handed off, never just on arrival. Early on, I had a single "highest seq seen" value that updated on every `onmessage`, whether or not it had been processed yet. That's a real bug, because under reordering you can receive seq 19 while still stuck waiting on seq 17, and reporting 19 in a `RESUME` would tell the server to skip 17 and 18 forever. Splitting "received" from "processed" into two separate values fixes this by construction.

`AgentClient.openSocket()` only ever calls `eventLog.getResumePoint()` for the `RESUME` payload. Nothing else is allowed to supply `last_seq`.

A second bug came up during chaos testing: when `AgentClient` opens a new socket (on reconnect, or under React StrictMode's mount-cleanup-mount in dev), the old socket can still be alive briefly and get force-closed by the server (it explicitly kills "replaced" connections). Without a guard, the old socket's `onclose` would fire after a newer connection had already taken over, see a flag that had since reset, and schedule a needless reconnect, which the server would then also replace, looping forever. Fix: every socket handler closes over its own specific `socket` and checks `this.socket === socket` before doing anything, so a stale socket's events become no-ops once a newer one exists.

---
## At 50 concurrent agent streams

Right now my app only ever talks to one agent at a time. There's one `AgentClient` (one socket), one `EventLog` (one seq counter), one session. Everything assumes "there is exactly one conversation happening."

If I had to show 50 agents streaming at once on one screen, here's what would actually break, and what I'd do instead:

**Problem 1: seq numbers from different connections mean nothing to each other.** My `EventLog` currently has one `expectedSeq` counter. Connection A's seq 5 and connection B's seq 5 are completely unrelated messages, they just happen to share a number. So instead of one global `EventLog`, I'd need one `EventLog` (and really, one whole reducer setup) per stream, kept totally separate. Mixing them up would be the same kind of bug as the duplicate/reorder bugs I already fixed, just at a bigger scale.

**Problem 2: rendering 50 full chat panels at once would be way too much for the browser.** Right now, when a response streams in, I show every token, every tool card, fully expanded. That's fine for one conversation. For 50 at once, I wouldn't show all of them in full detail, that's just too many DOM nodes updating constantly. Instead I'd show each stream as a small collapsed card by default (just a status dot, maybe "12 tokens/sec", last activity time), and only render the full detailed view for the one or two cards the user has actually clicked into. 

**Problem 3: I'd reach for a proper state library instead of plain `useReducer`.** Right now my whole app's state is one `useReducer` call in one hook, because there's only one thing to manage. With 50 independent streams, each needing its own connection, its own reducer state, its own lifecycle (connect, reconnect, disconnect), I think plain React state would get messy fast. I'd use something like Zustand to hold a map of "stream id to that stream's state and its `AgentClient` instance," and build a small reusable hook (like `useAgentStream(streamId)`) that any card component could call to get just its own slice of state. That way each card only re-renders when its own stream updates, not when any of the other 49 do. I haven't built this, but that's the direction I'd take it.

**Problem 4: the trace timeline would get hit hardest.** I already had to make sure the timeline doesn't re-render every row on every single token (using `React.memo` and keeping object references stable). With 50 streams all sending tokens, that same problem is 50x bigger. `React.memo` alone probably wouldn't be enough anymore. I'd look into only rendering the rows that are actually visible on screen instead of rendering every row that's ever happened, even the ones scrolled way off screen.

---
## At 100x longer responses

Right now, my app keeps the entire response in memory and in the DOM the whole time it's streaming. A turn's `blocks` array holds every block of text and every tool card from start to finish. A `tokenBatch` row in the timeline holds the entire accumulated text as one string. For a normal chat reply (a paragraph or two), this is totally fine.

But if responses were 100x longer, think full documents, not chat messages, this would actually break things:

**The text would get huge, and the browser may feeeze.** If a response is 50 pages long, that's potentially megabytes of text sitting in one block's `content` field, and the browser would have to render that as one big chunk. I'd change how text blocks work so they don't just keep growing one giant string forever. Instead, I would only keep the most recent bit of text "live" (the part still actively streaming in, for the typing effect), and anything that's already been streamed and scrolled out of view would get handed off to a virtualized list.

**The timeline's "click to expand and see full text" feature would also break.** Right now, clicking a `tokenBatch` row just dumps `row.text` (the whole accumulated string) into a `<pre>` tag. That's fine when it's a few hundred words. If it's a 50-page document, doing that in one go would freeze the tab while the browser tries to render it all at once. I'd need to either show it in pages (like a "load more" pattern) or virtualize that too, instead of rendering the whole thing the moment someone clicks expand.