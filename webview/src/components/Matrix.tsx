import { cssObj } from '../style';
import { Cell } from './Cell';
import {
  KINDS,
  KIND_LABEL,
  SCOPES,
  SCOPE_LABEL,
  type Bucket,
  type HarnessData,
  type Theme,
} from '../types';

type Props = {
  data: HarnessData;
  theme: Theme;
  query?: string;
  onOpen?: (filePath: string) => void;
};

export function Matrix({ data, theme, query = '', onOpen }: Props) {
  return (
    <div css={cssObj.matrix}>
      {SCOPES.flatMap((scope) =>
        KINDS.map((kind) => {
          const key = `${scope}.${kind}` as Bucket;
          const items = data.buckets[key] ?? [];
          const title = `${SCOPE_LABEL[scope]} · ${KIND_LABEL[kind]}`;
          return (
            <Cell
              key={key}
              title={title}
              items={items}
              theme={theme}
              query={query}
              onOpen={onOpen}
            />
          );
        }),
      )}
    </div>
  );
}
