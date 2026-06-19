import { highlightText } from '../utils/highlight';

interface HighlightedTextProps {
  text: string;
  query: string;
}

export function HighlightedText({ text, query }: HighlightedTextProps) {
  const segments = highlightText(text, query);

  return segments.map((seg, i) =>
    seg.highlighted ? (
      <span key={i} className="bg-gilded-gold/20 text-gilded-gold font-medium">
        {seg.text}
      </span>
    ) : (
      <span key={i}>{seg.text}</span>
    )
  );
}
