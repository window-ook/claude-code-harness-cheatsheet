# 치트시트 레이아웃 고도화 ("워프 매트릭스") 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use my:subagent-driven-development (recommended) or my:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cheatsheet 익스텐션의 매트릭스 UI에 "워프(warp)" 검색 동작을 추가한다. 검색 시 매칭 0인 셀은 dim, 매칭 그룹은 자동 펼침, Enter로 단일 매칭 즉시 열기. 헤더 이모지를 로고로, 텍스트 아이콘을 lucide-react로 전면 교체.

**Architecture:** 2×3 매트릭스와 검색 입력은 v0.2.0에서 이미 구현됨. Matrix 컴포넌트가 셀별 매칭 수를 1회 계산해 각 Cell/NamespaceGroup에 prop으로 흘려보낸다. 그룹 펼침 상태는 `useGroupCollapse` 훅이 검색 상태와 사용자 토글을 결합하여 결정한다. Enter 키와 첫 매칭 스크롤은 App 레벨에서 처리.

**Tech Stack:** React 18, TypeScript, @emotion/react, Vite, lucide-react (신규)

**참고 명세:** [`../specs/2026-05-24-cheatsheet-layout-warp-design.md`](../specs/2026-05-24-cheatsheet-layout-warp-design.md)

---

## 파일 구조 계획

### 새로 생성
- `webview/public/icon.png` — 빌드 시 `images/icon.png`에서 복사된 로고 (vite가 처리)
- `webview/src/components/Icons.tsx` — lucide-react 래퍼. 모든 아이콘이 동일 크기/색 토큰 사용
- `webview/src/hooks/useGroupCollapse.ts` — 그룹 펼침/접힘 상태 (세션 메모리만)

### 수정
- `webview/package.json` — `lucide-react` 의존성 추가
- `webview/src/style.ts` — dim, 그룹 토글, search summary, item flash, logo 토큰 추가
- `webview/src/App.tsx` — 로고 교체, lucide 아이콘 적용, Enter 처리, 검색 인디케이터
- `webview/src/components/Matrix.tsx` — 셀별 filteredCount, 첫 매칭 식별 계산
- `webview/src/components/Cell.tsx` — `dimmed` prop, 그룹 키 전달
- `webview/src/components/NamespaceGroup.tsx` — 토글 가능 헤더, ChevronIcon, 자동 펼침
- `webview/src/components/Item.tsx` — 첫 매칭 ref + scrollIntoView/flash 효과
- `webview/src/types.ts` — `GroupKey` 타입, `groupKeyFor` 헬퍼 추가

### 손대지 않음
- `src/extension.ts`, `src/scanner.ts`
- `package.json` (확장 메타데이터)
- `webview/vite.config.ts` (public 디렉토리는 vite 기본 처리)

---

## 사전 조건 확인

- [ ] **현재 작업 디렉토리 확인**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && pwd
```

기대 출력: `/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension`

- [ ] **현재 빌드가 통과하는지 확인 (시작점 검증)**

```bash
pnpm build 2>&1 | tail -10
```

기대 출력: `✓ built in ...` 으로 끝남. 에러 없음.

- [ ] **기존 검색 기능이 살아있는지 코드로 확인**

```bash
grep -l "filterItems" webview/src/types.ts webview/src/components/Cell.tsx
```

기대 출력: 두 파일 모두 출력됨 (이미 구현됨).

---

## Task 1: lucide-react 의존성 추가

**Files:**
- Modify: `webview/package.json`

- [ ] **Step 1: lucide-react 설치**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm add lucide-react
```

기대 출력: `+ lucide-react X.Y.Z` 메시지. `node_modules/lucide-react` 디렉토리 생성됨.

- [ ] **Step 2: package.json에 dependencies로 추가됐는지 확인**

```bash
grep "lucide-react" "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview/package.json"
```

기대 출력: `"lucide-react": "^X.Y.Z"` 한 줄.

- [ ] **Step 3: 빌드 통과 확인**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && pnpm build 2>&1 | tail -5
```

기대 출력: `✓ built in ...`. 에러 없음.

---

## Task 2: 로고 이미지를 webview/public/으로 복사

**Files:**
- Create: `webview/public/icon.png`

- [ ] **Step 1: public 디렉토리 만들고 이미지 복사**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && mkdir -p webview/public && cp images/icon.png webview/public/icon.png
```

기대 출력: 없음 (성공).

- [ ] **Step 2: 복사된 파일 확인**

```bash
ls -la webview/public/icon.png && file webview/public/icon.png
```

기대 출력: `73786` bytes 정도의 PNG 파일.

- [ ] **Step 3: vite가 dist에 포함하는지 빌드로 검증**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && pnpm build:webview 2>&1 | tail -10 && ls webview/dist/icon.png 2>&1
```

기대 출력: `webview/dist/icon.png` 파일이 존재.

---

## Task 3: Icons.tsx 래퍼 컴포넌트 만들기

**Files:**
- Create: `webview/src/components/Icons.tsx`

- [ ] **Step 1: Icons.tsx 파일 생성**

전체 내용:

```typescript
import {
  RefreshCw,
  Sun,
  Moon,
  Search,
  X,
  ChevronDown,
  ChevronRight,
  Circle,
  Sparkles,
  Terminal,
  Bot,
} from 'lucide-react';

type IconProps = {
  size?: number;
  className?: string;
};

export function RefreshIcon({ size = 14, className }: IconProps) {
  return <RefreshCw size={size} className={className} />;
}

export function SunIcon({ size = 14, className }: IconProps) {
  return <Sun size={size} className={className} />;
}

export function MoonIcon({ size = 14, className }: IconProps) {
  return <Moon size={size} className={className} />;
}

export function SearchIcon({ size = 14, className }: IconProps) {
  return <Search size={size} className={className} />;
}

export function ClearIcon({ size = 14, className }: IconProps) {
  return <X size={size} className={className} />;
}

type ChevronProps = IconProps & { expanded: boolean };
export function ChevronIcon({ expanded, size = 14, className }: ChevronProps) {
  return expanded ? (
    <ChevronDown size={size} className={className} />
  ) : (
    <ChevronRight size={size} className={className} />
  );
}

export function DotIcon({ size = 6, className }: IconProps) {
  return <Circle size={size} fill="currentColor" className={className} />;
}

import type { Kind } from '../types';

type KindIconProps = IconProps & { kind: Kind };
export function KindIcon({ kind, size = 14, className }: KindIconProps) {
  if (kind === 'skills') return <Sparkles size={size} className={className} />;
  if (kind === 'commands') return <Terminal size={size} className={className} />;
  return <Bot size={size} className={className} />;
}
```

- [ ] **Step 2: typecheck 통과 확인**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -5
```

기대 출력: 에러 없음 (빈 출력).

- [ ] **Step 3: 빌드 통과 확인**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && pnpm build 2>&1 | tail -5
```

기대 출력: `✓ built in ...`.

---

## Task 4: types.ts에 GroupKey 헬퍼 추가

**Files:**
- Modify: `webview/src/types.ts`

- [ ] **Step 1: 파일 끝에 GroupKey 타입과 헬퍼 추가**

`webview/src/types.ts` 파일 맨 끝에 다음을 추가:

```typescript
export type GroupKey = string;

export function groupKeyFor(item: { source: Source; pluginName?: string; namespace: string }): GroupKey {
  return `${item.source}::${item.pluginName ?? ''}::${item.namespace}`;
}

export function defaultExpandedFor(source: Source): boolean {
  return source === 'self';
}
```

기존 `groupItems`의 key 계산과 동일한 포맷이라는 점에 유의(`groupItems`는 `${item.source}::${item.pluginName ?? ''}::${item.namespace}` 사용). `groupKeyFor`를 재사용해서 두 곳이 어긋나지 않도록 `groupItems` 내부도 수정:

`webview/src/types.ts`에서 `groupItems` 내부의 `const key = ...` 줄을 다음으로 교체:

```typescript
    const key = groupKeyFor(item);
```

- [ ] **Step 2: typecheck 통과 확인**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -5
```

기대 출력: 에러 없음.

- [ ] **Step 3: 빌드 통과 확인**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && pnpm build 2>&1 | tail -5
```

기대 출력: `✓ built in ...`.

---

## Task 5: useGroupCollapse 훅 만들기

**Files:**
- Create: `webview/src/hooks/useGroupCollapse.ts`

- [ ] **Step 1: hooks 디렉토리와 훅 파일 생성**

```bash
mkdir -p "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview/src/hooks"
```

`webview/src/hooks/useGroupCollapse.ts` 전체 내용:

```typescript
import { useCallback, useState } from 'react';
import type { GroupKey } from '../types';

export type UseGroupCollapseResult = {
  isExpanded: (key: GroupKey, defaultExpanded: boolean, hasMatch: boolean) => boolean;
  toggle: (key: GroupKey, current: boolean) => void;
};

export function useGroupCollapse(query: string): UseGroupCollapseResult {
  const [manualState, setManualState] = useState<Map<GroupKey, boolean>>(new Map());

  const isExpanded = useCallback(
    (key: GroupKey, defaultExpanded: boolean, hasMatch: boolean) => {
      if (query) {
        return hasMatch;
      }
      if (manualState.has(key)) {
        return manualState.get(key)!;
      }
      return defaultExpanded;
    },
    [query, manualState],
  );

  const toggle = useCallback((key: GroupKey, current: boolean) => {
    setManualState((prev) => {
      const next = new Map(prev);
      next.set(key, !current);
      return next;
    });
  }, []);

  return { isExpanded, toggle };
}
```

규칙 요약:
- 검색 중이면: 매칭 있는 그룹만 펼침, 매칭 없으면 접음 (수동 상태 무시)
- 검색 없으면: 수동 토글 상태가 있으면 그것, 없으면 `defaultExpanded` (self=true, plugin=false)

- [ ] **Step 2: typecheck 통과**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -5
```

기대 출력: 에러 없음.

- [ ] **Step 3: 빌드 통과**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && pnpm build 2>&1 | tail -5
```

기대 출력: `✓ built in ...`.

---

## Task 6: style.ts에 새 토큰 추가

**Files:**
- Modify: `webview/src/style.ts`

- [ ] **Step 1: 기존 `cssObj` 끝부분에 새 스타일 추가**

`webview/src/style.ts`의 `cssObj` 객체 안, `highlight: (t: Tokens) => css\`...\`,` 다음 줄, 마감 `} as const;` 직전에 다음을 추가:

```typescript
  logo: css`
    width: 24px;
    height: 24px;
    border-radius: 4px;
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
```

- [ ] **Step 2: typecheck 통과**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -5
```

기대 출력: 에러 없음.

- [ ] **Step 3: 빌드 통과**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && pnpm build 2>&1 | tail -5
```

기대 출력: `✓ built in ...`.

---

## Task 7: NamespaceGroup에 접기/펼치기 동작 + Chevron 아이콘 추가

**Files:**
- Modify: `webview/src/components/NamespaceGroup.tsx`

- [ ] **Step 1: NamespaceGroup.tsx 전체 교체**

`webview/src/components/NamespaceGroup.tsx` 전체 내용을 다음으로 교체:

```typescript
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
```

- [ ] **Step 2: typecheck 확인 (Item.tsx 미수정이라 에러 예상)**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -10
```

기대 출력: `Item.tsx`에 `isFirstMatch` prop 미정의 에러. Task 8에서 해결.

---

## Task 8: Item.tsx에 첫 매칭 ref + flash 효과 추가

**Files:**
- Modify: `webview/src/components/Item.tsx`

- [ ] **Step 1: Item.tsx 전체 교체**

`webview/src/components/Item.tsx` 전체 내용을 다음으로 교체:

```typescript
import { useEffect, useRef, useState } from 'react';
import { cssObj, tokensFor } from '../style';
import { Highlight } from './Highlight';
import type { HarnessItem, Theme } from '../types';

type Props = {
  item: HarnessItem;
  theme: Theme;
  query?: string;
  isFirstMatch?: boolean;
  onOpen?: (filePath: string) => void;
};

export function Item({ item, theme, query = '', isFirstMatch = false, onOpen }: Props) {
  const t = tokensFor(theme);
  const isSub = !!item.isSubAsset;
  const clickable = !!item.filePath && !!onOpen;
  const ref = useRef<HTMLDivElement>(null);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (!isFirstMatch) {
      setFlashing(false);
      return;
    }
    ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    setFlashing(true);
    const timer = window.setTimeout(() => setFlashing(false), 1400);
    return () => window.clearTimeout(timer);
  }, [isFirstMatch, query]);

  const handleClick = () => {
    if (clickable && item.filePath && onOpen) onOpen(item.filePath);
  };

  return (
    <div
      ref={ref}
      css={[
        isSub ? cssObj.itemSub : cssObj.item,
        clickable && cssObj.itemClickable(t),
        flashing && cssObj.itemFlash(t),
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
```

- [ ] **Step 2: typecheck — Cell.tsx 미수정이라 prop 누락 에러 예상**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -10
```

기대 출력: `Cell.tsx`에서 `NamespaceGroup`에 `groupKey`, `expanded`, `onToggle` 등을 안 넘기는 에러. Task 9에서 해결.

---

## Task 9: Cell.tsx에 dimmed prop, 그룹 토글 전달 적용

**Files:**
- Modify: `webview/src/components/Cell.tsx`

- [ ] **Step 1: Cell.tsx 전체 교체**

`webview/src/components/Cell.tsx` 전체 내용을 다음으로 교체:

```typescript
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
```

참고:
- `DotIcon`은 `cellHeaderDot` span 안에 들어가 기존 점을 lucide의 채워진 Circle로 교체.
- `cssObj.cellHeaderDot`은 원래 dot 모양 자체였으나 이제 wrapper로 동작 (Task 11에서 토큰 정의 변경).
- `hasMatch`는 검색 중일 때만 의미가 있으며, 검색이 없으면 false.

- [ ] **Step 2: typecheck — Matrix.tsx 미수정이라 prop 누락 에러 예상**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -10
```

기대 출력: `Matrix.tsx`에서 `Cell`에 `dimmed`, `collapse`, `firstMatchKey` 누락 에러. Task 10에서 해결.

---

## Task 10: Matrix.tsx에 매칭 집계 + 첫 매칭 식별 추가

**Files:**
- Modify: `webview/src/components/Matrix.tsx`

- [ ] **Step 1: Matrix.tsx 전체 교체**

`webview/src/components/Matrix.tsx` 전체 내용을 다음으로 교체:

```typescript
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
```

참고: `useMemo`로 `onSummary` 호출하는 것은 부수효과 방지 + 동일 summary 재계산 회피용. 안전한 React 패턴이며 effect 대안. (불편하면 Task 12 App.tsx에서 별도 useMemo로 summary를 직접 계산하는 형태로 단순화 가능.)

- [ ] **Step 2: typecheck — App.tsx 미수정이라 prop 변경 에러 예상**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -15
```

기대 출력: `App.tsx`에서 `<Matrix>`에 `collapse` 누락 에러. Task 12에서 해결.

---

## Task 11: style.ts의 cellHeaderDot 토큰을 lucide DotIcon용으로 정리

**Files:**
- Modify: `webview/src/style.ts`

기존 `cellHeaderDot`는 직접 그린 원형 점 스타일이었음. 이제 lucide `Circle`을 감싸는 wrapper 역할로 바뀌어야 함.

- [ ] **Step 1: cellHeaderDot 토큰 수정**

`webview/src/style.ts`에서 다음 블록:

```typescript
  cellHeaderDot: (t: Tokens) => css`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${t.textTertiary};
    flex-shrink: 0;
  `,
```

위 블록을 다음으로 교체:

```typescript
  cellHeaderDot: (t: Tokens) => css`
    color: ${t.textTertiary};
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
  `,
```

색은 `currentColor`로 lucide `Circle`이 받아감. wrapper는 정렬과 색 토큰만 담당.

- [ ] **Step 2: typecheck 통과 (변경된 곳 외 에러는 다음 Task가 해결)**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -10
```

기대 출력: App.tsx 관련 에러만 남음. style 에러 없음.

---

## Task 12: App.tsx — 로고, lucide 아이콘, Enter 처리, 검색 인디케이터 전부 적용

**Files:**
- Modify: `webview/src/App.tsx`

- [ ] **Step 1: App.tsx 전체 교체**

`webview/src/App.tsx` 전체 내용을 다음으로 교체:

```typescript
import { useEffect, useMemo, useRef, useState } from 'react';
import { cssObj, tokensFor } from './style';
import { Matrix } from './components/Matrix';
import {
  KINDS,
  SCOPES,
  filterItems,
  groupKeyFor,
  type Bucket,
  type HarnessData,
  type HarnessItem,
  type Theme,
} from './types';
import { useGroupCollapse } from './hooks/useGroupCollapse';
import {
  RefreshIcon,
  SunIcon,
  MoonIcon,
  SearchIcon,
  ClearIcon,
} from './components/Icons';

declare global {
  interface Window {
    acquireVsCodeApi?: () => { postMessage: (msg: unknown) => void };
  }
}

const STORAGE_KEY = 'harness-cheatsheet-theme';

function readTheme(): Theme {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

function formatGeneratedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}년 ${pad(d.getMonth() + 1)}월 ${pad(d.getDate())} ${pad(d.getHours())}시 ${pad(d.getMinutes())}분`;
}

function computeSummary(data: HarnessData | null, query: string) {
  if (!data) return { totalShown: 0, totalAll: 0, dimmedCells: 0, firstMatch: undefined as HarnessItem | undefined };
  let totalShown = 0;
  let totalAll = 0;
  let dimmedCells = 0;
  let firstMatch: HarnessItem | undefined;
  for (const scope of SCOPES) {
    for (const kind of KINDS) {
      const key = `${scope}.${kind}` as Bucket;
      const items = data.buckets[key] ?? [];
      totalAll += items.length;
      if (query) {
        const matched = filterItems(items, query);
        totalShown += matched.length;
        if (matched.length === 0 && items.length > 0) dimmedCells += 1;
        if (!firstMatch && matched.length > 0) firstMatch = matched[0];
      }
    }
  }
  if (!query) totalShown = totalAll;
  return { totalShown, totalAll, dimmedCells, firstMatch };
}

export function App() {
  const [data, setData] = useState<HarnessData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const [query, setQuery] = useState('');
  const [logoFailed, setLogoFailed] = useState(false);
  const [vscodeApi] = useState(() => (window.acquireVsCodeApi ? window.acquireVsCodeApi() : null));
  const searchRef = useRef<HTMLInputElement>(null);
  const collapse = useGroupCollapse(query);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'harness/data' && msg.data) {
        setData(msg.data as HarnessData);
        setError(null);
      } else if (msg.type === 'harness/error') {
        setError(String(msg.message ?? 'unknown error'));
      }
    };
    window.addEventListener('message', handler);
    vscodeApi?.postMessage({ type: 'harness/ready' });
    return () => window.removeEventListener('message', handler);
  }, [vscodeApi]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (cmd && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setQuery('');
        searchRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const t = tokensFor(theme);
  const summary = useMemo(() => computeSummary(data, query), [data, query]);
  const firstMatchKey = summary.firstMatch
    ? `${groupKeyFor({
        source: summary.firstMatch.source,
        pluginName: summary.firstMatch.pluginName,
        namespace: summary.firstMatch.namespace,
      })}::${summary.firstMatch.name}`
    : undefined;

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const refresh = () => vscodeApi?.postMessage({ type: 'harness/refresh' });
  const openFile = (filePath: string) =>
    vscodeApi?.postMessage({ type: 'harness/openFile', filePath });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    if (!query) return;
    if (summary.totalShown === 1 && summary.firstMatch?.filePath) {
      openFile(summary.firstMatch.filePath);
    }
  };

  const isFiltering = query.length > 0;
  const renderSummary = () => {
    if (!data || !isFiltering) {
      return data ? <span>총 {summary.totalAll}개 발견</span> : null;
    }
    if (summary.totalShown === 0) {
      return <span css={cssObj.searchSummaryWarn(t)}>0건 매칭</span>;
    }
    if (summary.totalShown === 1) {
      return <span css={cssObj.searchSummaryHit(t)}>1건 — ⏎로 열기</span>;
    }
    return (
      <span css={cssObj.searchSummary(t)}>
        {summary.totalShown}개 매칭 / 총 {summary.totalAll}
      </span>
    );
  };

  return (
    <div css={cssObj.root(t)}>
      <div css={cssObj.header(t)}>
        {logoFailed ? (
          <span css={cssObj.headerTitle(t)}>✴️ 클로드 코드 하네스 치트 시트</span>
        ) : (
          <>
            <img
              src="./icon.png"
              alt="logo"
              css={cssObj.logo}
              onError={() => setLogoFailed(true)}
            />
            <span css={cssObj.headerTitle(t)}>클로드 코드 하네스 치트 시트</span>
          </>
        )}
        {renderSummary()}
        {data ? (
          <>
            <span>•</span>
            <span>({formatGeneratedAt(data.generatedAt)} 기준)</span>
          </>
        ) : null}
        <div css={cssObj.searchWrap(t)}>
          <span css={cssObj.searchIcon(t)}>
            <SearchIcon size={14} />
          </span>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="검색 (이름·설명·네임스페이스)"
            css={cssObj.searchInput(t)}
            spellCheck={false}
            autoComplete="off"
          />
          {query ? (
            <button
              type="button"
              css={cssObj.searchClear(t)}
              onClick={() => {
                setQuery('');
                searchRef.current?.focus();
              }}
              aria-label="검색 지우기"
              title="Esc"
            >
              <ClearIcon size={14} />
            </button>
          ) : null}
        </div>
        <span css={cssObj.searchHint(t)}>⌘F · /</span>
        <button type="button" css={cssObj.refreshButton(t)} onClick={refresh}>
          <RefreshIcon size={14} /> 다시 스캔
        </button>
        <button
          type="button"
          css={cssObj.themeToggle(t)}
          onClick={toggleTheme}
          aria-label="테마 전환"
        >
          {theme === 'dark' ? (
            <>
              <SunIcon size={14} /> 라이트
            </>
          ) : (
            <>
              <MoonIcon size={14} /> 다크
            </>
          )}
        </button>
      </div>
      {error ? (
        <div css={cssObj.loading(t)}>오류: {error}</div>
      ) : data ? (
        <Matrix
          data={data}
          theme={theme}
          query={query}
          collapse={collapse}
          onOpen={openFile}
        />
      ) : (
        <div css={cssObj.loading(t)}>스캔 중…</div>
      )}
      {/* firstMatchKey는 Matrix가 자체 계산해서 사용. App에서 별도 전달은 불필요. */}
      {firstMatchKey ? null : null}
    </div>
  );
}
```

참고:
- `summary`는 App에서도 계산하고, Matrix 안에서도 다시 계산 — 작은 중복이지만 props 결합도를 낮춰 단순함을 우선. 데이터가 1k 수준이라 무시 가능한 비용.
- `logoFailed`는 image onError 시 ✴️ 이모지 fallback.
- 검색 인디케이터는 데이터 영역 옆에 위치, 검색 없을 땐 `총 N개 발견`.

- [ ] **Step 2: typecheck 통과**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -10
```

기대 출력: 에러 없음 (빈 출력).

- [ ] **Step 3: 빌드 통과**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && pnpm build 2>&1 | tail -10
```

기대 출력: `✓ built in ...`. webview index.js 사이즈 약간 증가 (lucide 추가분).

---

## Task 13: Matrix.tsx 단순화 — App.tsx가 summary를 책임지므로 onSummary 제거

Task 12에서 App.tsx가 자체 `computeSummary`로 summary를 책임지게 되어, Matrix.tsx의 `onSummary` 콜백은 죽은 코드가 됨. 정리.

**Files:**
- Modify: `webview/src/components/Matrix.tsx`

- [ ] **Step 1: Matrix.tsx에서 onSummary 관련 제거**

`webview/src/components/Matrix.tsx` 전체 내용을 다음으로 교체:

```typescript
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
```

- [ ] **Step 2: typecheck 통과**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -5
```

기대 출력: 에러 없음.

- [ ] **Step 3: App.tsx에서 죽은 코드 제거**

`webview/src/App.tsx`에서 다음 두 줄을 제거:

```typescript
      {/* firstMatchKey는 Matrix가 자체 계산해서 사용. App에서 별도 전달은 불필요. */}
      {firstMatchKey ? null : null}
```

또한 App.tsx 상단의 import에서 `groupKeyFor`는 firstMatchKey 계산용으로만 쓰였으므로 함께 제거 가능. 하지만 `summary.firstMatch`로 Enter 시 즉시 열기는 여전히 사용하므로 `groupKeyFor` 자체 의존은 사라짐.

`webview/src/App.tsx`에서 다음 블록을 삭제:

```typescript
  const firstMatchKey = summary.firstMatch
    ? `${groupKeyFor({
        source: summary.firstMatch.source,
        pluginName: summary.firstMatch.pluginName,
        namespace: summary.firstMatch.namespace,
      })}::${summary.firstMatch.name}`
    : undefined;
```

`webview/src/App.tsx` 상단의 import에서 `groupKeyFor`를 제거:

```typescript
// 변경 전
import {
  KINDS,
  SCOPES,
  filterItems,
  groupKeyFor,
  type Bucket,
  type HarnessData,
  type HarnessItem,
  type Theme,
} from './types';

// 변경 후
import {
  KINDS,
  SCOPES,
  filterItems,
  type Bucket,
  type HarnessData,
  type HarnessItem,
  type Theme,
} from './types';
```

- [ ] **Step 4: 최종 typecheck + 빌드**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension/webview" && pnpm exec tsc --noEmit 2>&1 | tail -5 && cd .. && pnpm build 2>&1 | tail -10
```

기대 출력: typecheck 에러 없음. `✓ built in ...`. webview index.js 사이즈 표시.

---

## Task 14: VSIX 패키징 + 로컬 설치

**Files:** 없음 (도구 실행만)

- [ ] **Step 1: 기존 VSIX 제거 + 새로 패키징**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && rm -f claude-harness-cheatsheet-*.vsix && pnpm package 2>&1 | tail -30
```

기대 출력:
- `Files included in the VSIX:` 목록에 `images/icon.png`, `webview/dist/icon.png`, `webview/dist/assets/index.js` 포함
- 마지막 줄: `DONE Packaged: ... claude-harness-cheatsheet-0.2.0.vsix (N files, ~200KB)`
- `assets/`, `*.DS_Store`, `HANDOFF.md` 같은 파일이 **포함되지 않음**

- [ ] **Step 2: Cursor에 설치**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && cursor --install-extension claude-harness-cheatsheet-0.2.0.vsix --force 2>&1 | tail -5
```

기대 출력: `Extension 'claude-harness-cheatsheet-0.2.0.vsix' was successfully installed.`

- [ ] **Step 3: 사용자에게 재시작 요청**

이 단계는 자동화 불가. 다음을 사용자에게 안내:

```
Cursor를 ⌘Q로 완전 종료 후 재시작하세요. Cmd+Shift+H로 치트시트 패널을 열어주세요.
```

---

## Task 15: 수동 검증 시나리오 실행

**Files:** 없음 (사용자 수동 테스트)

각 시나리오를 사용자가 직접 확인하고 OK/NG를 알려줘야 함.

- [ ] **시나리오 1: 매트릭스 초기 로딩**

기대:
- 헤더 좌측에 로고 이미지(24×24) + "클로드 코드 하네스 치트 시트" 텍스트
- 검색 인디케이터 자리에 `총 1176개 발견`
- 각 셀: `self` 그룹은 펼침, `plugin` 그룹은 접힘
- 그룹 헤더에 chevron(▶/▼) lucide 아이콘

- [ ] **시나리오 2: 그룹 클릭 토글**

빈 검색에서:
- self 그룹 헤더 클릭 → 접힘
- plugin 그룹 헤더 클릭 → 펼침
- chevron이 ▶ ↔ ▼ 전환

- [ ] **시나리오 3: 검색 dim 동작 — `brain`**

- 검색바에 `brain` 입력
- 6개 셀 중 user.skills만 매칭. 나머지 5개 셀이 dim(0.35 opacity)
- user.skills 헤더 카운트 `1 / 312` (필터/전체)
- self 그룹 자동 펼침, plugin 그룹은 매칭 없으면 접힘
- 검색 인디케이터: `1건 — ⏎로 열기`
- 매칭된 brainstorming 항목에 짧은 플래시 효과

- [ ] **시나리오 4: Enter로 단일 매칭 열기**

- `brain` 검색 후 검색바 포커스 상태에서 Enter
- brainstorming의 SKILL.md가 에디터에 새로 열림

- [ ] **시나리오 5: 다건 매칭 — `review`**

- `review` 입력
- 여러 셀에 매칭, 각 셀 헤더에 `N / total` 표시
- 검색 인디케이터: `N개 매칭 / 총 1176`
- 첫 매칭 항목(셀 순회 순서대로)으로 자동 스크롤 + 플래시

- [ ] **시나리오 6: 매칭 없음 — `xyz_nomatch_zzz`**

- 모든 셀 dim
- 검색 인디케이터: `0건 매칭` (빨간색)
- Enter 키 → 아무 동작 안 함

- [ ] **시나리오 7: Esc로 검색 지우기**

- 검색바 포커스에서 Esc
- 검색어 비워짐, 모든 셀 dim 해제
- 그룹 펼침 상태: 사용자가 수동 토글한 것만 유지, 검색 중 자동 펼침은 해제되어 기본값으로 복귀

- [ ] **시나리오 8: 다크 ↔ 라이트 전환**

- 라이트 토글 클릭 (lucide `Sun` 아이콘 + "라이트" 텍스트)
- 라이트 테마 적용, 로고 이미지 그대로 보임, 아이콘 색 currentColor 자동 대응
- 다크로 다시 토글 → 원복

- [ ] **시나리오 9: 다시 스캔 버튼**

- "다시 스캔" 버튼 클릭 (lucide `RefreshCw` 아이콘)
- 매트릭스 재로딩

- [ ] **시나리오 10: Cmd+F / `/` 단축키**

- 패널이 포커스인 상태에서 ⌘F → 검색창 포커스 + 텍스트 선택
- 검색바 외 영역에서 `/` → 검색창 포커스

---

## Task 16: 출시 결정 (사용자 확인)

**Files:** 없음

수동 검증 통과 후, 사용자에게 출시 여부 확인.

- [ ] **Step 1: 사용자에게 marketplace 게시 여부 확인**

질문:
> "v0.2.0 검증 완료. Marketplace에 게시할까요? (`pnpm dlx vsce publish` 실행)"

- [ ] **Step 2: 승인 시 Marketplace 게시**

```bash
cd "/Users/woogy/Desktop/claudecode workflow/cheatsheet-extension" && pnpm dlx vsce publish 2>&1 | tail -10
```

기대 출력: `DONE Published windowook.claude-harness-cheatsheet v0.2.0.`

- [ ] **Step 3: Marketplace URL 확인**

URL: https://marketplace.visualstudio.com/items?itemName=windowook.claude-harness-cheatsheet

5~10분 후 새 버전 반영.

- [ ] **Step 4: HANDOFF.md 갱신**

다음 세션 인계용으로 `HANDOFF.md`의 "현재 상태" 섹션과 "다음 작업" 섹션을 v0.2.0 출시 완료 상태로 업데이트. 새 작업이 있으면 그것으로 대체.

---

## Self-Review 메모 (작성자 검토 완료)

**1. Spec coverage:**
- 매칭 0 dim 처리 → Task 9 (Cell `dimmed` prop) + Task 10 (Matrix dimmed 계산) + Task 11 (cellDimmed CSS Task 6에서 정의)
- 그룹 자동 펼침/접힘 → Task 5 (훅) + Task 7 (NamespaceGroup) + Task 9 (Cell에서 isExpanded 호출)
- Enter로 단일 매칭 열기 → Task 12 (handleSearchKeyDown)
- lucide-react 전면 도입 → Task 1 (의존성) + Task 3 (Icons 래퍼) + Task 7, 9, 12에서 사용
- 헤더 로고 → Task 2 (파일 복사) + Task 12 (App.tsx img + onError fallback)
- 첫 매칭 자동 스크롤 + 플래시 → Task 6 (itemFlash CSS) + Task 8 (Item useEffect) + Task 10/13 (firstMatchKey 계산)
- 검색 인디케이터 (`N개 매칭`, `1건 — ⏎`, `0건 매칭`) → Task 6 (스타일) + Task 12 (renderSummary)

**2. Placeholder scan:** 모든 코드 블록은 완전한 형태로 작성됨. TBD/TODO/"적절히" 없음.

**3. Type consistency:**
- `GroupKey` (Task 4) → `useGroupCollapse` (Task 5) → `NamespaceGroup.groupKey` (Task 7) → `Cell` (Task 9) → `Matrix` (Task 10, 13) → 일관됨.
- `firstMatchKey` 포맷: `${groupKey}::${item.name}` — Task 7, 10, 13에서 동일.
- `UseGroupCollapseResult` (Task 5) → `Cell.collapse: UseGroupCollapseResult` (Task 9) → `Matrix.collapse` (Task 10, 13) → `App` (Task 12) 일관됨.

**4. 보완 사항 처리:**
- Task 13에서 Task 10의 죽은 코드(`onSummary`, App.tsx의 firstMatchKey 계산)를 회수. 단일 구현 사이클 중 일시적 중복이 발생하지만 명시적으로 정리하는 단계를 둠.
