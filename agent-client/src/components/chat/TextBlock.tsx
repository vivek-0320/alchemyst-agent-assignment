interface TextBlockProps {
  id: string;
  content: string;
  isHighlighted: boolean;
  onSelect: (id: string) => void;
}

const TextBlock = ({ id, content, isHighlighted, onSelect }: TextBlockProps) => {
  return (
    <span
      onClick={() => onSelect(id)}
      className={`cursor-pointer rounded transition-colors ${isHighlighted ? "bg-blue-100" : ""}`}
    >
      {content}
    </span>
  );
};

export default TextBlock;