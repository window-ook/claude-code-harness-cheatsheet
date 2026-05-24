import { useMemo } from 'react';
import { cssObj } from '../style';
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
  type HarnessItem,
  type Theme,
} from '../types';
import type { UseGroupCollapseResult } from '../hooks/useGroupCollapse';

export type MatrixSummary = {
  totalShown: number;
  totalAll: number;
  firstMatchKey?: string;
  firstMatchItem?: HarnessItem;
};

type Props = {
  data: HarnessData;
  theme: Theme;
  query?: string;
  collapse: UseGroupCollapseResult;
  onOpen?: (filePath: string) => void;
  onSummary?: (summary: MatrixSummary) => void;
};

export function Matrix({ data, theme, query = '', collapse, onOpen, onSummary }: Props) {
  const summary = useMemo<MatrixSummary>(() => {
    let totalShown = 0;
    let totalAll = 0;
    let firstMatchKey: string | undefined;
    let firstMatchItem: HarnessItem | undefined;
    for (const scope of SCOPES) {
      for (const kind of KINDS) {
        const key = `${scope}.${kind}` as Bucket;
        const items = data.buckets[key] ?? [];
        totalAll += items.length;
        const matched = query ? filterItems(items, query) : items;
        totalShown += query ? matched.length : 0;
        if (query && !firstMatchItem && matched.length > 0) {
          firstMatchItem = matched[0];
          firstMatchKey = `${groupKeyFor({
            source: firstMatchItem.source,
            pluginName: firstMatchItem.pluginName,
            namespace: firstMatchItem.namespace,
          })}::${firstMatchItem.name}`;
        }
      }
    }
    if (!query) totalShown = totalAll;
    return { totalShown, totalAll, firstMatchKey, firstMatchItem };
  }, [data, query]);

  useMemo(() => {
    onSummary?.(summary);
    return null;
  }, [summary, onSummary]);

  return (
    <div css={cssObj.matrix}>
      {SCOPES.flatMap((scope) =>
        KINDS.map((kind) => {
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
              firstMatchKey={summary.firstMatchKey}
              onOpen={onOpen}
            />
          );
        }),
      )}
    </div>
  );
}
