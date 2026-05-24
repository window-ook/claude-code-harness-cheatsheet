import { cssObj, tokensFor } from '../style';
import { NamespaceGroup } from './NamespaceGroup';
import { filterItems, groupItems, type HarnessItem, type Theme } from '../types';

type Props = {
  title: string;
  items: HarnessItem[];
  theme: Theme;
  query?: string;
  onOpen?: (filePath: string) => void;
};

export function Cell({ title, items, theme, query = '', onOpen }: Props) {
  const t = tokensFor(theme);
  const filtered = filterItems(items, query);
  const groups = groupItems(filtered);
  const total = items.length;
  const shown = filtered.length;
  const isFiltering = query.length > 0;

  return (
    <div css={cssObj.cell(t)}>
      <div css={cssObj.cellHeader(t)}>
        <span css={cssObj.cellHeaderDot(t)} />
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
          groups.map((g) => (
            <NamespaceGroup
              key={g.key}
              namespace={g.namespace}
              source={g.source}
              pluginName={g.pluginName}
              items={g.items}
              theme={theme}
              query={query}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </div>
  );
}
