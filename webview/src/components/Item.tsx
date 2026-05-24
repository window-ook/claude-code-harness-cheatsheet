import { cssObj, tokensFor } from '../style';
import { Highlight } from './Highlight';
import type { HarnessItem, Theme } from '../types';

type Props = {
  item: HarnessItem;
  theme: Theme;
  query?: string;
  onOpen?: (filePath: string) => void;
};

export function Item({ item, theme, query = '', onOpen }: Props) {
  const t = tokensFor(theme);
  const isSub = !!item.isSubAsset;
  const clickable = !!item.filePath && !!onOpen;
  const handleClick = () => {
    if (clickable && item.filePath && onOpen) onOpen(item.filePath);
  };
  return (
    <div
      css={[
        isSub ? cssObj.itemSub : cssObj.item,
        clickable && cssObj.itemClickable(t),
      ]}
      onClick={clickable ? handleClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      title={item.filePath}
    >
      {isSub ? <span css={cssObj.itemSubBranch(t)}>└</span> : null}
      <div css={cssObj.itemBody}>
        <span css={isSub ? cssObj.itemNameSub(t) : cssObj.itemName(t)}>
          <Highlight text={item.name} query={query} theme={theme} />
        </span>
        {item.description ? (
          <span css={cssObj.itemDescription(t)}>
            <Highlight text={item.description} query={query} theme={theme} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
