import { cssObj, tokensFor } from '../style';
import { Item } from './Item';
import { Highlight } from './Highlight';
import type { HarnessItem, Source, Theme } from '../types';

type Props = {
  namespace: string;
  source: Source;
  pluginName?: string;
  items: HarnessItem[];
  theme: Theme;
  query?: string;
  onOpen?: (filePath: string) => void;
};

export function NamespaceGroup({
  namespace,
  source,
  pluginName,
  items,
  theme,
  query = '',
  onOpen,
}: Props) {
  const t = tokensFor(theme);
  const isPlugin = source === 'plugin';
  return (
    <div css={cssObj.namespaceGroup}>
      <div css={cssObj.namespaceHeader(t, isPlugin)}>
        <span css={cssObj.namespaceLabel(t, isPlugin)}>
          <Highlight text={namespace} query={query} theme={theme} />
        </span>
        {isPlugin ? (
          <span css={cssObj.namespacePluginBadge(t)}>{pluginName ?? 'plugin'}</span>
        ) : (
          <span css={cssObj.namespaceSelfBadge(t)}>self</span>
        )}
      </div>
      {items.map((item) => (
        <Item
          key={`${namespace}/${item.name}`}
          item={item}
          theme={theme}
          query={query}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
