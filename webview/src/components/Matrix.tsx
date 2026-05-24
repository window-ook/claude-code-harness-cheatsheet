import { useMemo } from 'react';
import { cssObj, tokensFor } from '../style';
import { Cell } from './Cell';
import {
  KINDS,
  KIND_LABEL,
  SCOPES,
  SCOPE_LABEL,
  filterItems,
  groupKeyFor,
  type Bucket,
  type HarnessData,
  type Scope,
  type Theme,
} from '../types';
import type { UseGroupCollapseResult } from '../hooks/useGroupCollapse';

type Props = {
  data: HarnessData;
  theme: Theme;
  query?: string;
  collapse: UseGroupCollapseResult;
  onOpen?: (filePath: string) => void;
};

function scopeIsEmpty(data: HarnessData, scope: Scope): boolean {
  for (const kind of KINDS) {
    const key = `${scope}.${kind}` as Bucket;
    if ((data.buckets[key] ?? []).length > 0) return false;
  }
  return true;
}

export function Matrix({ data, theme, query = '', collapse, onOpen }: Props) {
  const t = tokensFor(theme);

  const firstMatchKey = useMemo(() => {
    if (!query) return undefined;
    for (const scope of SCOPES) {
      for (const kind of KINDS) {
        const key = `${scope}.${kind}` as Bucket;
        const items = data.buckets[key] ?? [];
        const matched = filterItems(items, query);
        if (matched.length > 0) {
          const first = matched[0];
          return `${groupKeyFor({
            source: first.source,
            pluginName: first.pluginName,
            namespace: first.namespace,
          })}::${first.name}`;
        }
      }
    }
    return undefined;
  }, [data, query]);

  const allEmpty = SCOPES.every((s) => scopeIsEmpty(data, s));
  if (allEmpty) {
    return (
      <div css={cssObj.matrixEmpty(t)}>
        <div>조건에 맞는 항목이 없습니다.</div>
        <div css={cssObj.matrixEmptyHint(t)}>
          필터에서 스코프·종류·출처를 다시 선택하거나 검색어를 비워보세요.
        </div>
      </div>
    );
  }

  return (
    <div css={cssObj.matrix}>
      {SCOPES.map((scope) => {
        if (scopeIsEmpty(data, scope)) {
          return (
            <div
              key={`${scope}-placeholder`}
              css={cssObj.cellPlaceholder(t)}
              style={{ gridColumn: '1 / -1' }}
            >
              <span>
                {SCOPE_LABEL[scope]} 스코프에 항목이 없습니다 (스킬·커맨드·에이전트
                모두 0개)
              </span>
            </div>
          );
        }
        return KINDS.map((kind) => {
          const key = `${scope}.${kind}` as Bucket;
          const items = data.buckets[key] ?? [];
          const filtered = query ? filterItems(items, query) : items;
          const dimmed = !!query && filtered.length === 0;
          const title = `${SCOPE_LABEL[scope]} · ${KIND_LABEL[kind]}`;
          return (
            <Cell
              key={key}
              title={title}
              items={items}
              theme={theme}
              query={query}
              dimmed={dimmed}
              collapse={collapse}
              firstMatchKey={firstMatchKey}
              onOpen={onOpen}
            />
          );
        });
      })}
    </div>
  );
}
