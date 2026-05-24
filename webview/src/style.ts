import { css } from '@emotion/react';
import type { Theme } from './types';

type Tokens = {
  bg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  cellBg: string;
  cellHeaderBg: string;
  selfAccent: string;
  pluginAccent: string;
  badgeBg: string;
};

const DARK: Tokens = {
  bg: '#1A1A1A',
  border: '#333333',
  textPrimary: '#FFFFFF',
  textSecondary: '#C0C0C0',
  textTertiary: '#888888',
  cellBg: '#1F1F1F',
  cellHeaderBg: '#262626',
  selfAccent: '#6EE7B7',
  pluginAccent: '#FCA5A5',
  badgeBg: 'rgba(255, 255, 255, 0.06)',
};

const LIGHT: Tokens = {
  bg: '#FFFFFF',
  border: '#D0D0D0',
  textPrimary: '#000000',
  textSecondary: '#3A3A3A',
  textTertiary: '#7A7A7A',
  cellBg: '#FAFAFA',
  cellHeaderBg: '#F0F0F0',
  selfAccent: '#047857',
  pluginAccent: '#B91C1C',
  badgeBg: 'rgba(0, 0, 0, 0.05)',
};

export function tokensFor(theme: Theme): Tokens {
  return theme === 'light' ? LIGHT : DARK;
}

export const cssObj = {
  root: (t: Tokens) => css`
    width: 100vw;
    height: 100vh;
    background: ${t.bg};
    color: ${t.textPrimary};
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,

  header: (t: Tokens) => css`
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 12px;
    color: ${t.textSecondary};
    font-size: 14px;
  `,

  headerTitle: (t: Tokens) => css`
    color: ${t.textPrimary};
    font-size: 18px;
    font-weight: 700;
  `,

  themeToggle: (t: Tokens) => css`
    margin-left: auto;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: ${t.textPrimary};
    background: ${t.badgeBg};
    border: 1px solid ${t.border};
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
    &:hover {
      background: ${t.cellHeaderBg};
      border-color: ${t.textTertiary};
    }
    &:focus-visible {
      outline: 2px solid ${t.textTertiary};
      outline-offset: 2px;
    }
  `,

  refreshButton: (t: Tokens) => css`
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: ${t.textPrimary};
    background: ${t.badgeBg};
    border: 1px solid ${t.border};
    border-radius: 6px;
    cursor: pointer;
    &:hover {
      background: ${t.cellHeaderBg};
      border-color: ${t.textTertiary};
    }
  `,

  searchWrap: (t: Tokens) => css`
    position: relative;
    display: inline-flex;
    align-items: center;
    margin-left: 8px;
    flex: 0 1 360px;
    min-width: 200px;
  `,

  searchIcon: (t: Tokens) => css`
    position: absolute;
    left: 10px;
    pointer-events: none;
    font-size: 12px;
    color: ${t.textTertiary};
  `,

  searchInput: (t: Tokens) => css`
    width: 100%;
    padding: 6px 28px 6px 28px;
    font-size: 13px;
    color: ${t.textPrimary};
    background: ${t.cellBg};
    border: 1px solid ${t.border};
    border-radius: 6px;
    outline: none;
    transition: border-color 0.15s ease, background 0.15s ease;
    font-family: inherit;
    &::placeholder {
      color: ${t.textTertiary};
    }
    &:focus {
      border-color: ${t.textSecondary};
      background: ${t.cellHeaderBg};
    }
  `,

  searchClear: (t: Tokens) => css`
    position: absolute;
    right: 6px;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
    color: ${t.textTertiary};
    font-size: 14px;
    line-height: 1;
    &:hover {
      background: ${t.badgeBg};
      color: ${t.textPrimary};
    }
  `,

  searchHint: (t: Tokens) => css`
    font-size: 11px;
    color: ${t.textTertiary};
    margin-left: 4px;
  `,

  cellHeaderCount: (t: Tokens) => css`
    color: ${t.textTertiary};
    font-weight: 500;
    margin-left: 2px;
  `,

  cellHeaderCountFiltered: (t: Tokens) => css`
    color: ${t.selfAccent};
    font-weight: 600;
  `,

  highlight: (t: Tokens) => css`
    background: ${t.selfAccent}33;
    color: ${t.textPrimary};
    border-radius: 2px;
    padding: 0 1px;
  `,

  logo: css`
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: contain;
    flex-shrink: 0;
  `,

  cellDimmed: css`
    opacity: 0.35;
    filter: grayscale(0.4);
    transition: opacity 0.2s ease, filter 0.2s ease;
  `,

  groupHeaderClickable: (t: Tokens) => css`
    cursor: pointer;
    user-select: none;
    transition: background 0.1s ease;
    margin: 0 -4px;
    padding-left: 4px;
    padding-right: 4px;
    border-radius: 4px;
    &:hover {
      background: ${t.cellHeaderBg};
    }
  `,

  groupBodyHidden: css`
    display: none;
  `,

  groupChevron: (t: Tokens) => css`
    color: ${t.textTertiary};
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
  `,

  groupCount: (t: Tokens) => css`
    font-size: 11px;
    color: ${t.textTertiary};
    font-weight: 500;
    margin-left: auto;
  `,

  searchSummary: (t: Tokens) => css`
    font-size: 12px;
    color: ${t.textSecondary};
    white-space: nowrap;
  `,

  searchSummaryWarn: (t: Tokens) => css`
    font-size: 12px;
    color: ${t.pluginAccent};
    font-weight: 600;
    white-space: nowrap;
  `,

  searchSummaryHit: (t: Tokens) => css`
    font-size: 12px;
    color: ${t.selfAccent};
    font-weight: 600;
    white-space: nowrap;
  `,

  itemFlash: (t: Tokens) => css`
    animation: cheatsheet-flash 1.4s ease-out;
    @keyframes cheatsheet-flash {
      0% {
        background: ${t.selfAccent}55;
      }
      100% {
        background: transparent;
      }
    }
  `,

  matrix: css`
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 12px;
    min-height: 0;
  `,

  cell: (t: Tokens) => css`
    border: 1px solid ${t.border};
    border-radius: 6px;
    background: ${t.cellBg};
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  `,

  cellHeader: (t: Tokens) => css`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    background: ${t.cellHeaderBg};
    border-bottom: 1px solid ${t.border};
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: ${t.textPrimary};
  `,

  cellHeaderDot: (t: Tokens) => css`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${t.textTertiary};
    flex-shrink: 0;
  `,

  cellBody: css`
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
  `,

  cellEmpty: (t: Tokens) => css`
    color: ${t.textSecondary};
    font-size: 14px;
    padding: 12px 0;
  `,

  namespaceGroup: css`
    margin-bottom: 12px;
    &:last-of-type {
      margin-bottom: 0;
    }
  `,

  namespaceHeader: (t: Tokens, isPlugin: boolean) => css`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 0 6px;
    margin-bottom: 6px;
    border-bottom: 1px solid ${isPlugin ? t.pluginAccent : t.selfAccent}33;
  `,

  namespaceLabel: (t: Tokens, isPlugin: boolean) => css`
    font-size: 13px;
    font-weight: 700;
    color: ${isPlugin ? t.pluginAccent : t.selfAccent};
  `,

  namespaceSelfBadge: (t: Tokens) => css`
    font-size: 10px;
    font-weight: 600;
    color: ${t.selfAccent};
    background: ${t.badgeBg};
    border: 1px solid ${t.selfAccent}55;
    padding: 1px 6px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  `,

  namespacePluginBadge: (t: Tokens) => css`
    font-size: 10px;
    font-weight: 600;
    color: ${t.pluginAccent};
    background: ${t.badgeBg};
    border: 1px solid ${t.pluginAccent}55;
    padding: 1px 6px;
    border-radius: 3px;
    letter-spacing: 0.02em;
  `,

  item: css`
    padding: 6px 0;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 6px;
    border-radius: 4px;
  `,

  itemSub: css`
    padding: 2px 0 2px 8px;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 6px;
    border-radius: 4px;
  `,

  itemClickable: (t: Tokens) => css`
    cursor: pointer;
    margin: 0 -6px;
    padding-left: 6px;
    padding-right: 6px;
    transition: background 0.1s ease;
    &:hover {
      background: ${t.cellHeaderBg};
    }
  `,

  itemBody: css`
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    flex: 1;
  `,

  itemSubBranch: (t: Tokens) => css`
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    color: ${t.textTertiary};
    line-height: 1.4;
    flex-shrink: 0;
    user-select: none;
  `,

  itemName: (t: Tokens) => css`
    font-size: 15px;
    font-weight: 600;
    color: ${t.textPrimary};
    line-height: 1.3;
  `,

  itemNameSub: (t: Tokens) => css`
    font-size: 12px;
    font-weight: 400;
    color: ${t.textTertiary};
    line-height: 1.3;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  `,

  itemDescription: (t: Tokens) => css`
    font-size: 13px;
    color: ${t.textSecondary};
    line-height: 1.45;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  `,

  loading: (t: Tokens) => css`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${t.textSecondary};
    font-size: 14px;
  `,
} as const;
