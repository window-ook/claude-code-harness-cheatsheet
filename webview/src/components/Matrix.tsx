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

export function Matrix({ data, theme, query = '', collapse, onOpen }: Props) {
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
              firstMatchKey={firstMatchKey}
              onOpen={onOpen}
            />
          );
        }),
      )}
    </div>
  );
}
