import { cssObj, tokensFor } from '../style';
import { NamespaceGroup } from './NamespaceGroup';
import { DotIcon } from './Icons';
import {
  defaultExpandedFor,
  filterItems,
  groupItems,
  groupKeyFor,
  matchesQuery,
  type HarnessItem,
  type Theme,
} from '../types';
import type { UseGroupCollapseResult } from '../hooks/useGroupCollapse';

type Props = {
  title: string;
  items: HarnessItem[];
  theme: Theme;
  query?: string;
  dimmed?: boolean;
  collapse: UseGroupCollapseResult;
  firstMatchKey?: string;
  onOpen?: (filePath: string) => void;
};

export function Cell({
  title,
  items,
  theme,
  query = '',
  dimmed = false,
  collapse,
  firstMatchKey,
  onOpen,
}: Props) {
  const t = tokensFor(theme);
  const filtered = filterItems(items, query);
  const groups = groupItems(filtered);
  const total = items.length;
  const shown = filtered.length;
  const isFiltering = query.length > 0;

  return (
    <div css={[cssObj.cell(t), dimmed && cssObj.cellDimmed]}>
      <div css={cssObj.cellHeader(t)}>
        <span css={cssObj.cellHeaderDot(t)}>
          <DotIcon size={6} />
        </span>
        <span>{title}</span>
        <span css={cssObj.cellHeaderCount(t)}>
          {isFiltering ? (
            <>
              <span css={cssObj.cellHeaderCountFiltered(t)}>{shown}</span>
              <span> / {total}</span>
            </>
          ) : (
            <>({total})</>
          )}
        </span>
      </div>
      <div css={cssObj.cellBody}>
        {groups.length === 0 ? (
          <div css={cssObj.cellEmpty(t)}>
            {isFiltering && total > 0 ? '일치 항목 없음' : '없음'}
          </div>
        ) : (
          groups.map((g) => {
            const key = groupKeyFor({
              source: g.source,
              pluginName: g.pluginName,
              namespace: g.namespace,
            });
            const hasMatch = isFiltering
              ? g.items.some((it) => matchesQuery(it, query))
              : false;
            const expanded = collapse.isExpanded(
              key,
              defaultExpandedFor(g.source),
              hasMatch,
            );
            return (
              <NamespaceGroup
                key={g.key}
                groupKey={key}
                namespace={g.namespace}
                source={g.source}
                pluginName={g.pluginName}
                items={g.items}
                theme={theme}
                query={query}
                expanded={expanded}
                onToggle={collapse.toggle}
                firstMatchKey={firstMatchKey}
                onOpen={onOpen}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
