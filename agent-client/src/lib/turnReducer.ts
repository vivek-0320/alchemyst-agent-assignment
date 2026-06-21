import { TurnState, TurnEvent, Block, TextBlock, ToolBlock } from "@/lib/turnTypes";

function assertNever(x: never): never {
    throw new Error(`Unhandled TurnEvent: ${JSON.stringify(x)}`);
}

export function applyTurnEvent(state: TurnState, event: TurnEvent): TurnState {
    switch (event.kind) {
        case "token": {
            const last: TextBlock | ToolBlock = state.blocks[state.blocks.length - 1];

            if (last === undefined || last.type === "tool") {
                const fresh: TextBlock = {
                    id: crypto.randomUUID(),
                    type: "text",
                    content: event.text,
                };
                return {
                    blocks: [...state.blocks, fresh],
                    streamEnded: false,
                };
            }

            const updated: Block[] = state.blocks.map((block) =>
                block.type === "text" && block.id === last.id
                    ? { ...block, content: block.content + event.text }
                    : block
            );
            return { blocks: updated, streamEnded: false };
        }

        case "toolCall": {
            return {
                blocks: [
                    ...state.blocks,
                    {
                        id: event.callId,
                        type: "tool",
                        callId: event.callId,
                        toolName: event.toolName,
                        args: event.args,
                        status: "pending",
                        result: null,
                    },
                ],
                streamEnded: false,
            };
        }

        case "toolResult": {
            const updated: Block[] = state.blocks.map((block) =>
                block.type === "tool" && block.callId === event.callId
                    ? { ...block, result: event.result, status: "complete" as const }
                    : block
            );
            return { blocks: updated, streamEnded: false };
        }

        case "streamEnd":
            return { blocks: state.blocks, streamEnded: true };

        default:
            return assertNever(event);
    }
}