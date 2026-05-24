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

const AUTHOR_ACCENT_DARK: Record<string, string> = {
  'superpowers(obra)': '#FCA5A5',
  'impeccable(pbakaus)': '#FDBA74',
  'mattpocock': '#A5B4FC',
  'gstack': '#FCD34D',
  'Vercel Engineering': '#E5E7EB',
};

const AUTHOR_ACCENT_LIGHT: Record<string, string> = {
  'superpowers(obra)': '#B91C1C',
  'impeccable(pbakaus)': '#C2410C',
  'mattpocock': '#4338CA',
  'gstack': '#A16207',
  'Vercel Engineering': '#374151',
};

export function authorAccent(t: Tokens, author: string | undefined): string {
  if (!author) return t.textTertiary;
  const isDark = t.bg === DARK.bg;
  const table = isDark ? AUTHOR_ACCENT_DARK : AUTHOR_ACCENT_LIGHT;
  return table[author] ?? t.textSecondary;
}

export const cssObj = {
  root: (t: Tokens) => css`
    min-height: 100vh;
    background: ${t.bg};
    color: ${t.textPrimary};
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
  `,

  shell: (t: Tokens) => css`
    width: 100%;
    max-width: 1350px;
    height: 100vh;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-sizing: border-box;
    color: ${t.textPrimary};
    overflow: visible;
  `,

  header: (t: Tokens) => css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    color: ${t.textSecondary};
    font-size: 14px;
  `,

  headerTitle: (t: Tokens) => css`
    color: ${t.textPrimary};
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
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
    display: inline-flex;
    align-items: center;
    gap: 6px;
    line-height: 1;
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
    display: inline-flex;
    align-items: center;
    gap: 6px;
    line-height: 1;
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
    color: ${t.textTertiary};
    display: inline-flex;
    align-items: center;
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

  groupFilterWrap: (t: Tokens) => css`
    position: relative;
    display: inline-flex;
    align-items: center;
  `,

  groupFilterToggle: (t: Tokens, active: boolean) => css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    color: ${t.textPrimary};
    background: ${active ? t.cellHeaderBg : t.badgeBg};
    border: 1px solid ${active ? t.textTertiary : t.border};
    border-radius: 6px;
    cursor: pointer;
    line-height: 1;
    &:hover {
      background: ${t.cellHeaderBg};
      border-color: ${t.textTertiary};
    }
  `,

  groupFilterBadge: (t: Tokens) => css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    padding: 1px 5px;
    font-size: 10px;
    font-weight: 700;
    color: ${t.textPrimary};
    background: ${t.selfAccent}55;
    border-radius: 8px;
    line-height: 1.2;
  `,

  groupFilterPanel: (t: Tokens) => css`
    position: fixed;
    z-index: 1000;
    width: 360px;
    max-width: min(560px, 90vw);
    max-height: min(70vh, 480px);
    overflow-y: auto;
    background: ${t.cellBg};
    color: ${t.textPrimary};
    border: 1px solid ${t.border};
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    scrollbar-width: thin;
    scrollbar-color: ${t.border} transparent;
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      background: ${t.cellBg};
    }
    &::-webkit-scrollbar-thumb {
      background: ${t.border};
      border-radius: 4px;
      border: 2px solid ${t.cellBg};
      background-clip: padding-box;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: ${t.textTertiary};
      background-clip: padding-box;
      border: 2px solid ${t.cellBg};
    }
  `,

  groupFilterSectionLabel: (t: Tokens) => css`
    font-size: 10px;
    font-weight: 700;
    color: ${t.textTertiary};
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 8px 8px 4px;
    margin-top: 2px;
  `,

  groupFilterRow: (t: Tokens) => css`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    color: ${t.textPrimary};
    user-select: none;
    &:hover {
      background: ${t.cellHeaderBg};
    }
  `,

  groupFilterCheckbox: (t: Tokens) => css`
    width: 14px;
    height: 14px;
    accent-color: ${t.selfAccent};
    cursor: pointer;
  `,

  groupFilterCount: (t: Tokens) => css`
    margin-left: auto;
    font-size: 11px;
    color: ${t.textTertiary};
  `,

  groupFilterDivider: (t: Tokens) => css`
    height: 1px;
    background: ${t.border};
    margin: 4px 0;
  `,

  groupFilterActionRow: (t: Tokens) => css`
    display: flex;
    gap: 6px;
    padding: 4px 6px;
  `,

  groupFilterActionButton: (t: Tokens) => css`
    flex: 1;
    padding: 5px 8px;
    font-size: 11px;
    font-weight: 600;
    color: ${t.textPrimary};
    background: ${t.badgeBg};
    border: 1px solid ${t.border};
    border-radius: 5px;
    cursor: pointer;
    line-height: 1;
    &:hover {
      background: ${t.cellHeaderBg};
      border-color: ${t.textTertiary};
    }
  `,

  headerSpacer: css`
    flex: 1 1 auto;
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
    width: 32px;
    height: 32px;
    border-radius: 6px;
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

  detailRoot: (t: Tokens) => css`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 4px 2px 24px;
    scrollbar-width: thin;
    scrollbar-color: ${t.border} transparent;
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${t.border};
      border-radius: 4px;
      border: 2px solid transparent;
      background-clip: content-box;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: ${t.textTertiary};
      background-clip: content-box;
    }
  `,

  detailBackBar: (t: Tokens) => css`
    display: flex;
    align-items: center;
    gap: 10px;
  `,

  detailBackButton: (t: Tokens) => css`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    color: ${t.textPrimary};
    background: ${t.badgeBg};
    border: 1px solid ${t.border};
    border-radius: 6px;
    cursor: pointer;
    line-height: 1;
    &:hover {
      background: ${t.cellHeaderBg};
      border-color: ${t.textTertiary};
    }
  `,

  detailHeader: (t: Tokens) => css`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px 18px;
    background: ${t.cellBg};
    border: 1px solid ${t.border};
    border-radius: 8px;
  `,

  detailTitle: (t: Tokens) => css`
    font-size: 22px;
    font-weight: 800;
    color: ${t.textPrimary};
    line-height: 1.25;
    word-break: break-word;
  `,

  detailBadges: css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  `,

  detailAuthorLine: (t: Tokens) => css`
    font-size: 12px;
    color: ${t.textSecondary};
    margin-top: 2px;
  `,

  detailBadge: (t: Tokens, kind: 'scope' | 'kind' | 'self' | 'plugin') => css`
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
    line-height: 1;
    border: 1px solid
      ${kind === 'self' ? t.selfAccent + '55' : kind === 'plugin' ? t.pluginAccent + '55' : t.border};
    color: ${kind === 'self' ? t.selfAccent : kind === 'plugin' ? t.pluginAccent : t.textSecondary};
    background: ${t.badgeBg};
  `,

  detailTriggerCard: (t: Tokens) => css`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    background: ${t.cellBg};
    border: 1px solid ${t.border};
    border-radius: 8px;
  `,

  detailTriggerRow: (t: Tokens) => css`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  `,

  detailTriggerLabel: (t: Tokens) => css`
    font-size: 11px;
    font-weight: 700;
    color: ${t.textTertiary};
    text-transform: uppercase;
    letter-spacing: 0.06em;
    min-width: 72px;
  `,

  detailTriggerValue: (t: Tokens) => css`
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    color: ${t.textPrimary};
    background: ${t.cellHeaderBg};
    border: 1px solid ${t.border};
    border-radius: 4px;
    padding: 4px 8px;
  `,

  detailTriggerPlain: (t: Tokens) => css`
    font-size: 13px;
    color: ${t.textSecondary};
  `,

  detailTriggerOk: (t: Tokens) => css`
    font-size: 13px;
    font-weight: 600;
    color: ${t.selfAccent};
  `,

  detailTriggerNo: (t: Tokens) => css`
    font-size: 13px;
    font-weight: 600;
    color: ${t.pluginAccent};
  `,

  detailOpenButton: (t: Tokens) => css`
    margin-left: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    color: ${t.textPrimary};
    background: ${t.badgeBg};
    border: 1px solid ${t.border};
    border-radius: 6px;
    cursor: pointer;
    line-height: 1;
    &:hover {
      background: ${t.cellHeaderBg};
      border-color: ${t.textTertiary};
    }
  `,

  detailRelatedCard: (t: Tokens) => css`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
    background: ${t.cellBg};
    border: 1px solid ${t.border};
    border-radius: 8px;
  `,

  detailRelatedTitle: (t: Tokens) => css`
    font-size: 11px;
    font-weight: 700;
    color: ${t.textTertiary};
    text-transform: uppercase;
    letter-spacing: 0.06em;
  `,

  detailRelatedChips: (t: Tokens) => css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
  `,

  detailRelatedChip: (t: Tokens, author: string | undefined) => {
    const accent = authorAccent(t, author);
    return css`
      font-size: 12px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 4px;
      line-height: 1;
      border: 1px solid ${accent}55;
      color: ${accent};
      background: ${t.badgeBg};
      cursor: pointer;
      font-family: inherit;
      &:hover {
        background: ${t.cellHeaderBg};
        border-color: ${accent};
      }
    `;
  },

  detailRelatedOrphan: (t: Tokens) => css`
    font-size: 12px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 4px;
    line-height: 1;
    border: 1px dashed ${t.border};
    color: ${t.textTertiary};
    background: transparent;
    font-style: italic;
  `,

  detailContentCard: (t: Tokens) => css`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 18px;
    background: ${t.cellBg};
    border: 1px solid ${t.border};
    border-radius: 8px;
  `,

  detailTabBar: (t: Tokens) => css`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding-bottom: 8px;
    border-bottom: 1px solid ${t.border};
  `,

  detailTab: (t: Tokens, active: boolean) => css`
    padding: 5px 10px;
    font-size: 12px;
    font-weight: ${active ? 700 : 500};
    color: ${active ? t.textPrimary : t.textTertiary};
    background: ${active ? t.cellHeaderBg : 'transparent'};
    border: 1px solid ${active ? t.textSecondary : t.border};
    border-radius: 5px;
    cursor: pointer;
    line-height: 1;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    &:hover {
      background: ${t.cellHeaderBg};
      color: ${t.textPrimary};
    }
  `,

  detailLoading: (t: Tokens) => css`
    color: ${t.textSecondary};
    font-size: 14px;
    padding: 24px;
    text-align: center;
  `,

  matrix: css`
    flex: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 12px;
    min-height: 0;
  `,

  cellPlaceholder: (t: Tokens) => css`
    border: 1px dashed ${t.border};
    border-radius: 6px;
    background: transparent;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${t.textTertiary};
    font-size: 12px;
  `,

  matrixEmpty: (t: Tokens) => css`
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border: 1px dashed ${t.border};
    border-radius: 8px;
    color: ${t.textSecondary};
    font-size: 14px;
    padding: 32px;
    text-align: center;
  `,

  matrixEmptyHint: (t: Tokens) => css`
    color: ${t.textTertiary};
    font-size: 12px;
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
    color: ${t.textTertiary};
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  `,

  cellBody: (t: Tokens) => css`
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px;
    scrollbar-width: thin;
    scrollbar-color: ${t.border} transparent;
    &::-webkit-scrollbar {
      width: 8px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: ${t.border};
      border-radius: 4px;
      border: 2px solid transparent;
      background-clip: content-box;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: ${t.textTertiary};
      background-clip: content-box;
    }
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
    font-style: italic;
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
