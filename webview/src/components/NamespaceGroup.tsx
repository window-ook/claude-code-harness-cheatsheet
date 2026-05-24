import { cssObj, tokensFor } from '../style';
import { Item } from './Item';
import { Highlight } from './Highlight';
import { ChevronIcon } from './Icons';
import type { HarnessItem, Source, Theme } from '../types';

type Props = {
  groupKey: string;
  namespace: string;
  source: Source;
  pluginName?: string;
  items: HarnessItem[];
  theme: Theme;
  query?: string;
  expanded: boolean;
  onToggle: (key: string, current: boolean) => void;
  firstMatchKey?: string;
  onOpen?: (filePath: string) => void;
};

export function NamespaceGroup({
  groupKey,
  namespace,
  source,
  pluginName,
  items,
  theme,
  query = '',
  expanded,
  onToggle,
  firstMatchKey,
  onOpen,
}: Props) {
  const t = tokensFor(theme);
  const isPlugin = source === 'plugin';
  return (
    <div css={cssObj.namespaceGroup}>
      <div
        css={[cssObj.namespaceHeader(t, isPlugin), cssObj.groupHeaderClickable(t)]}
        onClick={() => onToggle(groupKey, expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(groupKey, expanded);
          }
        }}
      >
        <span css={cssObj.groupChevron(t)}>
          <ChevronIcon expanded={expanded} size={14} />
        </span>
        <span css={cssObj.namespaceLabel(t, isPlugin)}>
          <Highlight text={namespace} query={query} theme={theme} />
        </span>
        {isPlugin ? (
          <span css={cssObj.namespacePluginBadge(t)}>{pluginName ?? 'plugin'}</span>
        ) : (
          <span css={cssObj.namespaceSelfBadge(t)}>self</span>
        )}
        <span css={cssObj.groupCount(t)}>({items.length})</span>
      </div>
      <div css={expanded ? undefined : cssObj.groupBodyHidden}>
        {items.map((item) => {
          const itemKey = `${item.namespace}/${item.name}`;
          const isFirstMatch = firstMatchKey === `${groupKey}::${item.name}`;
          return (
            <Item
              key={itemKey}
              item={item}
              theme={theme}
              query={query}
              isFirstMatch={isFirstMatch}
              onOpen={onOpen}
            />
          );
        })}
      </div>
    </div>
  );
}
