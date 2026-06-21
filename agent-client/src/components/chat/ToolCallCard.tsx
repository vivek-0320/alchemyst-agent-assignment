import { ToolBlock } from "@/lib/turnTypes"
import { useEffect, useRef } from "react"

function ToolCallCard({ toolBlock, isHighlighted, onSelect }: {
  toolBlock: ToolBlock;
  isHighlighted: boolean;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  return (
    <div
      ref={ref}
      onClick={() => onSelect(toolBlock.id)}
      className={`${isHighlighted ? "ring-2 ring-blue-400" : ""} bg-white/60 border border-gray-200/60 rounded-xl p-3 text-sm font-mono overflow-x-auto text-gray-700`}
    >
      <div className="font-semibold text-gray-900 mb-1">Tool Name : {toolBlock.toolName}</div>
      <div className="opacity-80">
        {JSON.stringify(toolBlock.args, null, 2)}
      </div>
      {toolBlock.status === "complete" && (
        <div className="mt-2 pt-2 border-t border-gray-200/60 opacity-80">
          <div className="font-semibold text-gray-900 mb-1">Result : </div>
          {JSON.stringify(toolBlock.result, null, 2)}
        </div>
      )}
    </div>
  )
}

export default ToolCallCard