interface ComplementaryHighlightTextProps {
  text: string;
}

export function ComplementaryHighlightText({ text }: ComplementaryHighlightTextProps) {
  if (!/\bcomplimentary\b|\bcomplementary\b/i.test(text)) {
    return <>{text}</>;
  }

  return (
    <span className="gk-complementary-badge inline rounded-sm border border-emerald-300/35 bg-emerald-500/10 px-1.5 py-0.5 font-semibold text-emerald-100">
      {text}
    </span>
  );
}
