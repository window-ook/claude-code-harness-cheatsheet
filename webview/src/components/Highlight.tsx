import { cssObj, tokensFor } from '../style';
import type { Theme } from '../types';

type Props = {
  text: string;
  query: string;
  theme: Theme;
};

export function Highlight({ text, query, theme }: Props) {
  if (!query) return <>{text}</>;
  const t = tokensFor(theme);
  const needle = query.toLowerCase();
  const hay = text.toLowerCase();
  const parts: Array<{ str: string; hit: boolean }> = [];
  let i = 0;
  while (i < text.length) {
    const idx = hay.indexOf(needle, i);
    if (idx === -1) {
      parts.push({ str: text.slice(i), hit: false });
      break;
    }
    if (idx > i) parts.push({ str: text.slice(i, idx), hit: false });
    parts.push({ str: text.slice(idx, idx + needle.length), hit: true });
    i = idx + needle.length;
  }
  return (
    <>
      {parts.map((p, k) =>
        p.hit ? (
          <mark key={k} css={cssObj.highlight(t)}>
            {p.str}
          </mark>
        ) : (
          <span key={k}>{p.str}</span>
        ),
      )}
    </>
  );
}
