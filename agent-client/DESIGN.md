# Design

This document describes the shape of the system and why it's organized this way. 

## Core idea

The whole client is one data pipeline with a single direction of flow: raw bytes off the wire become progressively more trustworthy and more structured as they move up through the layers, and nothing upstream of a given layer ever has to re-derive a guarantee that a lower layer already provides.

```

raw WebSocket frames

  -> EventLog            (ordered, deduplicated)

  -> AgentClient         (typed protocol messages -> callbacks)

  -> useAgent hook       (callbacks -> dispatch calls)

  -> sessionReducer      (composes turnReducer + timeline bookkeeping)

  -> React render        (ChatPanel, Timeline)

```

---  
## Why two reducers instead of one


`turnReducer` and `sessionReducer` could have been a single function. They're split because they answer genuinely different questions:

- `turnReducer` (`applyTurnEvent`) only ever knows about **one agent turn's blocks**. It has no concept of conversation history, the user, or anything that happened before this turn started. Its entire job: given the blocks built so far and one new event, what do the blocks look like now?

- `sessionReducer` (`applySessionEvent`) knows about the **whole session** , every past turn, whether an agent turn is currently in progress, and the full protocol trace timeline. It doesn't build block content itself; it decides *which* turn an event belongs to, hands the actual content-building work to `turnReducer`, and reassembles the result into a `Turn`.


This composition (one reducer calling another, rather than one reducer doing everything) is what let `turnReducer` stay completely unchanged while the trace timeline (Task 2) was added on top of it, the timeline is purely a `sessionReducer`-level concern, layered in without touching the block-building logic that Task 1 already proved correct.

---
## Why state lives in a hook, not a global store
  
There's exactly one `AgentClient` instance and one `useReducer` per browser tab, owned by `useAgent.tsx`. No Redux, Zustand, or Context provider. The reasoning: the hard problems in this app : ordering, deduplication, turn-sealing, reconnection, are all solved as pure functions and a plain class, independent of any state-management library. A global store would add indirection without solving any problem this app actually has; there's only one consumer tree (`ChatPanel` and `Timeline`, both fed from the same `useAgentClient()` call in `page.tsx`), so prop-drilling the returned object two levels deep is simpler than introducing a provider for a single, page-scoped piece of state.

---

## Why ids are shared across layers instead of looked up


A `TextBlock` and its corresponding `tokenBatch` timeline row share the same `id`. A `ToolBlock` and its `toolCall` timeline row share `id === callId`. This was a deliberate choice over maintaining a separate id-to-id mapping table: `sessionReducer` already computes both representations from the same incoming event in the same function call, so it can hand the *same* generated id to both outputs directly. This makes the bidirectional highlighting between the chat panel and the timeline a simple equality check (`highlightedId === row.id`) on both sides, with no translation layer that could drift out of sync.

---
## Why immutability is enforced everywhere, not just "where it matters"
  
Every reducer case returns new arrays/objects rather than mutating in place, *and* deliberately preserves the reference of anything that didn't actually change (e.g. `turnReducer`'s token-append case only creates a new object for the one block being extended; every earlier block in the array keeps its exact prior reference). It's the mechanism that makes two specific guarantees hold:

1. **No layout shift on tool call interruption** , since earlier blocks never get a new reference, React never re-renders or remounts anything above a newly appended block.

2. **The trace timeline doesn't jank under high-frequency token streaming** . `TimelineRowView` is wrapped in `React.memo` with a reference-equality comparator, so a token arriving only causes the one live `tokenBatch` row to re-render; every other row, holding the same reference as last render, is skipped entirely by React.
  
---
## Why connection-state tracking distinguishes "intentional" from "unintentional" closes

`AgentClient` only schedules a reconnect on an *unintentional* close. A deliberate `disconnect()` call, or a clean server-initiated close (e.g. the agent-server replacing a connection), sets a flag that's checked before any reconnect logic runs. Without this distinction, the client would fight a server or component telling it "stop" by immediately trying to reconnect , which is exactly the bug that caused a real, observed infinite reconnect loop during development (see `DECISIONS.md` for the full mechanism). Every socket-level event handler additionally checks that it's still attached to the *current* socket (`this.socket === socket`) before acting, since a previous socket can remain alive briefly after a new one is opened and must not be allowed to act as if it were still authoritative.

---

## What's deliberately *not* abstracted

A few places where adding another layer of indirection was considered and rejected:

- **Filtering and search in the timeline** live as local component state in `Timeline.tsx`, not lifted into the session reducer. Nothing outside that one component needs to know what's currently filtered , lifting it would only add surface area.

- **Expand/collapse state for a `tokenBatch` row** lives locally in `TokenBatchRow`, separate from the row's highlight state, since the two are independent (a row can be expanded and highlighted in any combination) and conflating them into one piece of state would force artificial coupling.

---