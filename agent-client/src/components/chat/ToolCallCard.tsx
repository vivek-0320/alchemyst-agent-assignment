import { ToolBlock } from "@/lib/turnTypes"

const ToolCallCard = ({ toolBlock }: { toolBlock: ToolBlock }) => {
  return (
    <div className="bg-white/60 border border-gray-200/60 rounded-xl p-3 text-sm font-mono overflow-x-auto text-gray-700">
      <div className="font-semibold text-gray-900 mb-1">{toolBlock.toolName}</div>
      <div className="opacity-80">
        {JSON.stringify(toolBlock.args, null, 2)}
      </div>
      {toolBlock.status === "complete" && (
        <div className="mt-2 pt-2 border-t border-gray-200/60 opacity-80">
          Result : {JSON.stringify(toolBlock.result, null, 2)}
        </div>
      )}
    </div>
  )
}

export default ToolCallCard
