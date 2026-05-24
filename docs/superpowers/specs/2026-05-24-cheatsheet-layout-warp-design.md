# 치트시트 레이아웃 고도화 — "워프 매트릭스" 디자인 명세

작성일: 2026-05-24
대상 버전: v0.2.0 (검색·로고와 함께 배포)

## 1. 배경

### 문제

`Claude Harness Cheatsheet` 익스텐션 v0.1.0은 2×3 매트릭스(유저/프로젝트 × 스킬/커맨드/에이전트)에 ~1,176개 항목을 표시한다. 한 셀(`plugin.skills`)에 800개에 가까운 항목이 펼쳐져 스크롤이 압도적으로 길어, 사용자가 원하는 항목을 시각적으로 찾기 어렵다.

검색 기능은 이번 사이클(v0.2.0)에 추가되었으나, 검색만으로는 "이름이 가물가물한 것 찾기"와 "이 상황에 뭘 써야 할지 둘러보기"라는 두 가지 핵심 시나리오를 모두 해결하지 못한다.

### 핵심 시나리오

1. **이름이 가물가물한 것 찾기** — 부분 키워드 기억, 빠른 시각 식별 필요
2. **이 상황에 뭘 써야 했지** — 명사형 키워드(PR, 테스트, 커밋)로 description 매칭

### 제약 / 정체성

- 치트시트의 본질은 "6개 영역을 한눈에 훑는" 시각적 카탈로그.
- 명령 팔레트(`Cmd+Shift+P`)와 Quick Pick(`Cmd+Shift+Alt+H`)이 이미 존재하므로, 단순한 검색 박스로 대체하면 차별성이 사라진다.
- "자주 쓰는 것 강조" 같은 패턴은 본 도구의 목적(가물가물한 것 찾기)과 정면으로 충돌하므로 채택하지 않는다.

## 2. 디자인 결정: "워프 매트릭스"

### 핵심 아이디어

매트릭스 2×3 그리드를 유지하되, 검색을 "스포트라이트"로 만든다. 검색어를 치면:

- **매칭 0인 셀은 자동 dim(흐림) 처리** — 시선이 답이 있는 셀로 즉시 향함.
- **매칭이 있는 셀의 그룹은 자동 펼침** — 어디에 답이 있는지 즉시 보임.
- **전체 매칭이 1건이면 `Enter`로 바로 열기** — Quick Pick과 동급의 속도.

이는 종이 치트시트에서 손가락으로 짚는 정신 모델과 동일하며, 매트릭스 정체성을 깨지 않는다.

### 선택지 비교 결과

| 방식 | 가물가물 찾기 | 둘러보기 | 치트시트다움 | 변경량 |
|------|---|---|---|---|
| B' (단순 접기) | ★★★ | ★★★ | ★★★★★ | ★ |
| C (사이드바+디테일) | ★★★★ | ★★★★ | ★★ | ★★★★ |
| **F (워프 매트릭스)** | **★★★★★** | **★★★★** | **★★★★★** | **★★★** |
| G (오버레이만) | ★★★★★ | ★ | ★ | ★★★★★ |

F를 채택한 이유: 정체성을 유지하면서도 시각적 압축과 빠른 검색 두 가지를 모두 달성한다.

## 3. UX 동작 명세

### 기본 상태 (검색어 없음)

- 매트릭스 2×3 그리드 유지.
- **각 셀 내부의 그룹 기본 상태**:
  - `self` 그룹: **펼침** (보통 항목 수가 적음)
  - `plugin` 그룹: **접힘** (압도적으로 많음)
- 셀 헤더 카운트: `유저·스킬 (312)`
- 항목 description: 2줄 clamp (기존 유지)

### 검색 중 상태 (query 1자 이상)

- **매칭 0인 셀**: `opacity: 0.35` + `filter: grayscale(0.4)`로 dim 처리.
- **매칭 있는 셀**:
  - 헤더 카운트가 `2 / 312` 형태로 갱신 (필터된/전체).
  - 매칭된 그룹은 자동 펼침 (접힘 상태였더라도).
  - 매칭 없는 그룹은 접힘 유지.
  - 매칭 텍스트 하이라이트 (이미 v0.2.0 검색 구현분).
- **dim된 셀의 상호작용**: 클릭은 가능하지만 시각적으로만 비활성화. 그룹 헤더 클릭은 작동하나 그룹 안에 항목이 0이므로 의미는 없음. dim 자체는 시각적 가이드.
- **검색바 옆 인디케이터**:
  - 매칭 2건 이상: `25개 매칭 · 4개 셀`
  - 매칭 1건: `1건 — ⏎로 열기`
  - 매칭 0건: `0건 매칭` (경고 톤)
- **첫 매칭 항목 자동 스크롤**: 검색어가 변경될 때마다 가장 먼저 나오는 매칭 항목을 `scrollIntoView({ block: 'nearest' })` + 1.5초 강조 효과.

### 키보드 동작

| 키 | 동작 |
|---|---|
| `Cmd+F` / `/` | 검색창 포커스 (구현 완료) |
| `Esc` (검색 포커스 중) | 검색 지우기 + blur (구현 완료) |
| `Enter` (검색 포커스 중) | 매칭 1건이면 그 항목 열기 / 그 외에는 첫 매칭으로 스크롤 |

`↑`/`↓` 항목 간 이동은 이번 버전 범위에 포함하지 않는다.

### 그룹 접기/펼치기

- 그룹 헤더(`namespace` 영역)를 클릭하면 토글.
- 토글 상태는 **세션 메모리만** 사용. localStorage에 저장하지 않는다. 매번 익스텐션 재시작 시 초기 상태(self 펼침 / plugin 접힘)로 리셋.
- 검색 중에는 사용자 수동 접음을 무시하고 자동 펼침이 우선. 검색이 끝나면 자동 펼침 해제.

## 4. 시각 변경

### 헤더 타이틀

- 기존: `✴️ 클로드 코드 하네스 치트 시트`
- 변경: `[로고 이미지 24×24] 클로드 코드 하네스 치트 시트`
- 이미지 소스: `webview/public/icon.png` (빌드 시 `images/icon.png`에서 복사)
- `<img onError>`로 fallback: 로딩 실패 시 기존 `✴️` 이모지로 자동 대체.

### lucide-react 아이콘 도입

이모지 아이콘을 모두 lucide 아이콘으로 교체:

| 위치 | 기존 | 변경 |
|------|------|------|
| 다시 스캔 버튼 | `↻` | `<RefreshCw size={14} />` |
| 라이트 토글 | `☀` | `<Sun size={14} />` |
| 다크 토글 | `🌙` | `<Moon size={14} />` |
| 검색 아이콘 | `🔍` | `<Search size={14} />` |
| 검색 지우기 | `×` | `<X size={14} />` |
| 그룹 펼침 | (텍스트 ▼) | `<ChevronDown size={14} />` |
| 그룹 접힘 | (텍스트 ▶) | `<ChevronRight size={14} />` |
| 셀 헤더 dot | `•` (커스텀) | `<Circle size={6} fill />` |
| 카테고리 prefix | 없음 | 스킬 `<Sparkles />`, 커맨드 `<Terminal />`, 에이전트 `<Bot />` |
| 서브에셋 트리 | `└` | 유지 (lucide 대체 없음, 텍스트가 더 명확) |

색은 lucide의 `currentColor` 기본 사용 → 테마 토큰 자동 대응. 번들 크기는 tree-shaking으로 사용한 ~10개만 포함 (~5KB).

### 새 시각 토큰 / CSS

`style.ts`에 추가:

- `cellDimmed`: `opacity: 0.35; filter: grayscale(0.4); transition: opacity 0.2s ease`
- `groupHeaderClickable`: `cursor: pointer; padding/hover` (이미 namespaceHeader 있으나 클릭 가능 표시 강화)
- `groupBody` / `groupBodyCollapsed`: `display: none` 토글
- `searchSummary`: 인디케이터용 작은 텍스트 스타일 (matched/total 표시)
- `searchSummaryWarn`: 매칭 0건 경고 톤
- `itemHighlightFlash`: 첫 매칭 항목의 1.5초 강조 (background pulse 후 fade out)
- `logoImage`: `width: 24px; height: 24px; border-radius: 4px;`

## 5. 아키텍처 / 컴포넌트

### 디렉토리 변경

```
webview/
├── public/
│   └── icon.png                # 빌드 시 images/icon.png에서 복사
├── src/
│   ├── App.tsx                 # query, Enter 키, 인디케이터, 로고
│   ├── components/
│   │   ├── Matrix.tsx          # cell별 매칭 수 집계
│   │   ├── Cell.tsx            # dimmed 상태, 필터/카운트
│   │   ├── NamespaceGroup.tsx  # 접기/펼치기, 자동 펼침
│   │   ├── Item.tsx            # 매칭 시 첫 항목 ref + scrollIntoView
│   │   ├── Highlight.tsx       # (이미 있음)
│   │   └── Icons.tsx           # NEW: lucide 래퍼
│   ├── hooks/
│   │   └── useGroupCollapse.ts # NEW: 접기 상태 (세션 메모리)
│   ├── types.ts                # 변경 없음 (filterItems, matchesQuery 그대로)
│   └── style.ts                # 새 토큰 추가
```

### 새 파일

**`components/Icons.tsx`** — lucide-react 컴포넌트를 프로젝트 토큰으로 래핑.

```typescript
import { RefreshCw, Sun, Moon, Search, X, ChevronDown, ChevronRight, ... } from 'lucide-react';

export const RefreshIcon = (props) => <RefreshCw size={14} {...props} />;
export const SearchIcon = (props) => <Search size={14} {...props} />;
export const ChevronIcon = ({ expanded, ...rest }) =>
  expanded ? <ChevronDown size={14} {...rest} /> : <ChevronRight size={14} {...rest} />;
// ... etc
```

크기와 스타일이 한 곳에서 관리되어 일관성 보장.

**`hooks/useGroupCollapse.ts`** — 접기/펼치기 상태 관리.

```typescript
type GroupKey = string; // `${source}::${pluginName}::${namespace}`

export function useGroupCollapse(query: string) {
  const [manualState, setManualState] = useState<Map<GroupKey, boolean>>(new Map());

  const isExpanded = (key: GroupKey, defaultExpanded: boolean, hasMatch: boolean) => {
    if (query && hasMatch) return true;      // 검색 중 자동 펼침 우선
    if (query && !hasMatch) return false;    // 검색 중 매칭 없으면 접음
    if (manualState.has(key)) return manualState.get(key)!;
    return defaultExpanded;                  // self=true, plugin=false
  };

  const toggle = (key: GroupKey, current: boolean) => {
    setManualState((prev) => new Map(prev).set(key, !current));
  };

  return { isExpanded, toggle };
}
```

상태는 React state로만 관리 — 익스텐션 재시작 시 자동 리셋.

### 데이터 흐름

```
App.tsx (query state, vscodeApi)
    ↓ query
Matrix.tsx (전체 filterItems 한 번 호출 → cell별 매칭 수, 전체 매칭 수, 첫 매칭 ref 계산)
    ↓ { items, filteredCount, dimmed, query }
Cell.tsx (dimmed=true면 cellDimmed 스타일)
    ↓ { items, groupKey, hasMatch, query }
NamespaceGroup.tsx (useGroupCollapse로 isExpanded 결정 → body 토글)
    ↓ { item, query, isFirstMatch }
Item.tsx (isFirstMatch면 ref + 강조)
```

### 매칭 수 집계 / 첫 매칭 ref

`Matrix.tsx`에서 query가 바뀔 때마다:

1. `useMemo`로 cell별 필터링 1회 수행.
2. 전체 매칭 수 합산.
3. 첫 매칭 항목의 `groupKey` + `name`을 식별 (cell 순회 순서대로).
4. `Cell.tsx`에 props로 전달.
5. `Item.tsx`에서 자신이 첫 매칭이면 `useEffect`로 `scrollIntoView` + 강조.

### Enter 키 동작

`App.tsx`의 검색 input에 `onKeyDown`:

```typescript
onKeyDown={(e) => {
  if (e.key === 'Enter') {
    if (totalMatched === 1 && firstMatchPath) {
      openFile(firstMatchPath);
    } else if (firstMatchPath) {
      // scrollIntoView는 Item.tsx의 useEffect로 자동
    }
  }
}}
```

`firstMatchPath`는 Matrix가 계산해서 App으로 콜백으로 올려보낼 수 있고, 또는 App에서 같은 매칭 로직을 useMemo로 한 번 더 돌리는 것도 가능 (코드 단순). 후자가 결합도가 낮아 더 낫다.

## 6. 에러 처리 / 엣지 케이스

| 케이스 | 대응 |
|--------|------|
| 로고 이미지 로딩 실패 | `<img onError>`로 ✴️ 이모지 fallback |
| 검색어가 정규식 특수문자 | `String.includes` 기반이라 안전. 변경 없음 |
| 모든 셀이 dim (매칭 0건) | 인디케이터에 `0건 매칭` 경고 톤 표시 |
| Enter인데 매칭 0건 | no-op (조용히 무시) |
| 검색 중 사용자 수동 접기 | 자동 펼침 우선, 무시 |
| 매칭 수백 건 | 첫 매칭만 scrollIntoView. 가상화는 측정 후 결정 |
| lucide 번들 비대 | tree-shaking 확인. 5KB 초과 시 lucide(SVG) 직접 import 전환 |
| 라이트 모드에서 로고 가시성 | 로고가 검은 배경 + 주황이라 라이트 모드에서도 보임. 필요 시 흰 padding 추가 |
| 매우 좁은 viewport | 검색바가 헤더에서 다음 줄로 wrap (`flex-wrap: wrap` 이미 있음) |

## 7. 테스트 / 검증

자동 테스트 인프라가 없으므로 **수동 검증 시나리오**로 대신:

| 시나리오 | 기대 동작 |
|---------|----------|
| 매트릭스 초기 로딩 | self 그룹 펼침, plugin 그룹 접힘. 카운트 정확 |
| 빈 검색에서 그룹 헤더 클릭 | 토글됨 |
| `brain` 검색 | user.skills 셀만 강조, 나머지 5개 dim. self 그룹 자동 펼침. 매칭 1건 인디케이터 표시 |
| `brain` 입력 후 Enter | brainstorming SKILL.md 열림 |
| `review` 검색 | 여러 셀에 매칭. 각 셀 헤더에 `N / total`. 첫 매칭 항목 scrollIntoView |
| `xyz_nomatch` 검색 | 6개 셀 모두 dim, 인디케이터 `0건 매칭` 경고 톤 |
| `Esc` 키 | 검색 지워지고 dim 해제. 그룹 상태는 사용자가 수동 변경한 것만 유지, 자동 펼침은 해제 |
| 다크 ↔ 라이트 전환 | 로고, 아이콘, dim 효과 모두 정상 표시 |
| 로고 파일 손상 (수동 테스트) | ✴️ 이모지로 자동 대체, 콘솔 에러 없음 |

## 8. 마이그레이션 / 호환성

- v0.1.0 사용자는 자동 업데이트(VSCode/Cursor가 처리)로 변경사항을 즉시 보게 됨.
- 키보드 단축키(`Cmd+Shift+H`, `Cmd+Shift+Alt+H`)는 변경 없음.
- Extension ↔ Webview 메시지 프로토콜은 변경 없음 (`harness/ready`, `harness/data`, `harness/openFile`, `harness/refresh`, `harness/error` 그대로).
- scanner.ts는 손대지 않음.

## 9. 범위 외 (Out of Scope)

이번 사이클에 의도적으로 제외:

- 즐겨찾기 / 최근 사용 / 사용 빈도 추적 (목적과 충돌)
- 카테고리 사이드바 (C) / 단일 리스트 + 패싯 (E) (정체성 손상)
- 가상화 (성능 측정 전엔 불필요)
- localStorage 기반 그룹 접기 상태 영속화 (사용자 명시 거부)
- fuzzy 매칭 (substring 검색으로 충분)
- ↑/↓ 키로 항목 간 이동
- 항목 미리보기 (디테일 뷰)

## 10. 출시 절차

1. 구현 + 로컬 테스트 (수동 시나리오)
2. `pnpm package` → `claude-harness-cheatsheet-0.2.0.vsix`
3. Cursor에 `--install-extension --force` 설치 → ⌘Q 후 재시작 → 검증
4. `pnpm dlx vsce publish` (이미 0.2.0으로 package.json 설정됨)
5. Marketplace 반영 확인 (5~10분 소요)

## 부록 A: ASCII 와이어프레임

### 기본 상태
```
┌─────────────────────────────────────────────────────────────────┐
│ [로고] 클로드 코드 하네스 치트 시트  총 1176개  [Search 🔍 ]  ↻ ☀ │
├─────────────────────────────────────────────────────────────────┤
│ ● 유저·스킬 (312)    │ ● 유저·커맨드 (23) │ ● 유저·에이전트 (0)  │
│ ▼ self (5)           │ ▼ self (12)        │ (없음)               │
│   brainstorming…     │   my-review…       │                      │
│   shape…             │   …                │                      │
│ ▶ claude-plug (790)  │ ▶ claude-plug (11) │                      │
│ ▶ obsidian (10)      │                    │                      │
├──────────────────────┼────────────────────┼──────────────────────┤
│ ● 플러그인·스킬 (X) │ ● 플러그인·커맨드  │ ● 플러그인·에이전트  │
│ (project scope)      │ ...                │ ...                  │
└──────────────────────┴────────────────────┴──────────────────────┘
```

### 검색 `brain` 입력 시
```
┌─────────────────────────────────────────────────────────────────┐
│ [로고] 치트 시트  1건 — ⏎로 열기  [brain ×]  ↻ ☀                │
├─────────────────────────────────────────────────────────────────┤
│ ● 유저·스킬 1/312    │ ● 유저·커맨드 0/23 │ ● 유저·에이전트 0    │
│ ▼ self (1)           │ ░ DIMMED ░         │ ░ DIMMED ░          │
│   ★ ⚡brain⚡storming│                    │                      │
│ ▶ claude-plug (0)    │                    │                      │
├──────────────────────┼────────────────────┼──────────────────────┤
│ ░ DIMMED ░           │ ░ DIMMED ░         │ ░ DIMMED ░          │
└──────────────────────┴────────────────────┴──────────────────────┘
```
