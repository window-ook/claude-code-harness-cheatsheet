import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { css } from '@emotion/react';
import { tokensFor } from '../style';
import type { Theme } from '../types';

marked.setOptions({
  gfm: true,
  breaks: false,
});

type Props = {
  source: string;
  theme: Theme;
};

export function MarkdownView({ source, theme }: Props) {
  const t = tokensFor(theme);

  const html = useMemo(() => {
    const raw = marked.parse(source) as string;
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['target'],
    });
  }, [source]);

  const proseCss = css`
    color: ${t.textPrimary};
    font-size: 14px;
    line-height: 1.6;
    word-break: break-word;
    overflow-wrap: anywhere;

    h1, h2, h3, h4, h5, h6 {
      color: ${t.textPrimary};
      margin: 1.6em 0 0.6em;
      font-weight: 700;
      line-height: 1.3;
    }
    h1 { font-size: 22px; border-bottom: 1px solid ${t.border}; padding-bottom: 6px; }
    h2 { font-size: 18px; border-bottom: 1px solid ${t.border}; padding-bottom: 4px; }
    h3 { font-size: 16px; }
    h4, h5, h6 { font-size: 14px; }

    p { margin: 0.7em 0; color: ${t.textSecondary}; }

    a {
      color: ${t.selfAccent};
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    ul, ol {
      margin: 0.6em 0;
      padding-left: 1.4em;
      color: ${t.textSecondary};
    }
    li { margin: 0.25em 0; }
    li > p { margin: 0.25em 0; }

    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.92em;
      background: ${t.badgeBg};
      padding: 1px 5px;
      border-radius: 3px;
      border: 1px solid ${t.border};
      color: ${t.textPrimary};
    }

    pre {
      background: ${t.cellHeaderBg};
      border: 1px solid ${t.border};
      border-radius: 6px;
      padding: 12px 14px;
      overflow-x: auto;
      margin: 0.9em 0;
      line-height: 1.5;
      font-size: 12.5px;

      code {
        background: transparent;
        border: 0;
        padding: 0;
        font-size: inherit;
      }
    }

    blockquote {
      margin: 0.8em 0;
      padding: 4px 14px;
      border-left: 3px solid ${t.border};
      color: ${t.textTertiary};
      background: ${t.badgeBg};
      border-radius: 0 4px 4px 0;
      p { color: inherit; }
    }

    table {
      border-collapse: collapse;
      margin: 0.8em 0;
      font-size: 13px;
      display: block;
      overflow-x: auto;
    }
    th, td {
      border: 1px solid ${t.border};
      padding: 6px 10px;
      text-align: left;
    }
    th { background: ${t.cellHeaderBg}; font-weight: 700; color: ${t.textPrimary}; }
    td { color: ${t.textSecondary}; }

    hr {
      border: 0;
      border-top: 1px solid ${t.border};
      margin: 1.4em 0;
    }

    img {
      max-width: 100%;
      border-radius: 4px;
    }

    strong { color: ${t.textPrimary}; font-weight: 700; }
    em { color: ${t.textPrimary}; }

    input[type='checkbox'] {
      margin-right: 6px;
    }
  `;

  return <div css={proseCss} dangerouslySetInnerHTML={{ __html: html }} />;
}
