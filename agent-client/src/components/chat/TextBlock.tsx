import { useEffect, useRef } from "react"

interface TextBlockProps {
  id: string;
  content: string;
  isHighlighted: boolean;
  onSelect: (id: string) => void;
}

const TextBlock = ({ id, content, isHighlighted, onSelect }: TextBlockProps) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isHighlighted) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  return (
    <span
      ref={ref}
      onClick={() => onSelect(id)}
      className={`cursor-pointer rounded transition-colors ${isHighlighted ? "bg-blue-100" : ""}`}
    >
      {content}
    </span>
  );
};

export default TextBlock;