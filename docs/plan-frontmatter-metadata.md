---
title: Frontmatter 메타데이터 확장 계획 (author / relates / triggers)
status: draft
created: 2026-05-25
owner: window-ook
---

# Frontmatter 메타데이터 확장 계획

## 1. 배경

현재 cheatsheet 플러그인은 skill의 `name`, `description`, `namespace`, `source(self/plugin)`만 인식한다. skill 카탈로그가 커지면서 다음 한계가 드러난다:

- **출처 식별 부족**: 유저 스코프(`source: self`)로 들어와 있는 skill 중 실제로는 외부 묶음(superpowers, impeccable, mattpocock, gstack 등)에서 가져온 것이 다수다. 플러그인 캐시가 아니라 직접 복사된 skill은 cheatsheet에서 `self` 한 덩어리로만 보인다.
- **관계 정보 부재**: superpowers의 `writing-plans → executing-plans → verification-before-completion` 같이 시퀀셜하게 함께 쓰이는 skill, impeccable의 `craft → shape → polish` 같은 워크플로우가 description 안에 산문으로만 존재한다.
- **트리거 키워드의 description 오염**: `monitor-tanstack`, `office-hours` 등 일부 skill은 description의 절반 이상이 트리거 키워드 나열이라 사람용 설명이 묻힌다.

이 셋을 frontmatter의 새 필드 3개(`author`, `relates`, `triggers`)로 해소한다.

## 2. 목표

1. cheatsheet UI에서 **author 칩 기반 필터링** 제공.
2. skill 간 **관계 정보 표시**(양방향 합집합 상호 링킹) 제공.
3. **트리거 키워드를 검색 매칭에 포함** + 상세 뷰에서 시각 노출.
4. 다른 사람이 채택할 수 있도록 **스키마를 문서화**한다.

비목표:
- 모델의 자동 invocation 동작은 건드리지 않는다. `triggers`는 cheatsheet 검색·표시 메타로만 사용한다.
- 파일 패턴 기반 자동 추천은 제공하지 않는다 (filePatterns 필드, suggestForFile 명령 모두 폐기).
- description 본문은 마이그레이션 단계에서 손대지 않는다 (별도 작업으로 분리 가능).

## 3. 스키마 정의

### 3.1 `author: string`

작성자/출처 식별자. 외부 묶음에서 가져온 경우 출처 패키지를 명시.

```yaml
author: superpowers(obra)       # 외부 출처 + GitHub 핸들
author: impeccable(pbakaus)
author: mattpocock
author: gstack
author: window-ook              # 본인 작성
author: Vercel Engineering      # 조직 단위
```

규약:
- 외부 출처는 `패키지명(메인테이너핸들)` 또는 `메인테이너핸들` 단일 토큰.
- 본인 작성은 GitHub 핸들 그대로.

### 3.2 `relates: string[]`

같은 워크플로우/출처에서 함께 쓰이는 skill의 slug 배열. 양방향 링크 의도. 관계 종류(requires/pairs-with/alternatives)는 구분하지 않는다 — "관련 있음"만 표현.

```yaml
relates:
  - my:executing-plans
  - my:verification-before-completion
```

규약:
- 값은 대상 skill의 `name` 필드 그대로 (네임스페이스 포함).
- 양방향 무결성은 cheatsheet의 lint 명령으로 검증 (3.5 참조).
- 빈 배열 또는 필드 부재 모두 허용.

### 3.3 `triggers: { keywords?: string[] }`

cheatsheet의 검색 매칭 확장에만 사용되는 메타. 모델 자동 호출에는 영향 없고, 자동 추천 기능도 제공하지 않는다.

```yaml
triggers:
  keywords:
    - useQuery
    - useSuspenseQuery
    - 캐시 무효화
```

규약:
- `keywords`: 검색창 입력과 부분 문자열 매칭(대소문자 무시). 기존 `matchesQuery`의 매칭 대상에 추가.
- description 본문에 키워드를 산문으로 박아 둘 부담을 덜고, 키워드만 따로 떼어 관리할 수 있게 함.
- 필드 부재 허용.

### 3.4 표준화 문서

플러그인 저장소에 `docs/SCHEMA.md`를 별도로 작성해 위 3개 필드의 사양·예시·linting 규칙을 정리. README에서 링크. 향후 다른 사람이 자기 skill에 채택할 수 있는 형태로.

### 3.5 Lint 명령

`claudeHarnessCheatsheet.lint`를 신설해 다음을 검사한다:

- `relates`에 적힌 slug가 실제로 존재하는가
- A가 B를 `relates`로 가리키면 B도 A를 포함하는가 (양방향 무결성)
- `author`가 비어 있는 skill 목록

문제는 output channel에 출력하고, quick fix는 v2 이후로 미룬다.

## 4. 작업 트랙

### Track A — skill frontmatter 마이그레이션

대상: `~/.claude/skills/` 의 모든 SKILL.md + symlink로 연결된 `~/.agents/skills/`.

이미 완료된 상태:
- ✅ 46개 SKILL.md에 `author` 필드 추가 완료 (별도 세션에서 처리됨).

남은 작업:
- A1. **`relates` 데이터 수집·작성** (수동, 전수 46개)
  - superpowers 14개: `writing-plans ↔ executing-plans ↔ subagent-driven-development ↔ verification-before-completion ↔ requesting-code-review` 시퀀스, `brainstorming → writing-plans` 등.
  - impeccable 10개 (`craft → shape → polish`, `bolder ↔ quieter` 등).
  - mattpocock 3개, gstack 1개는 상호 또는 워크플로우상 관련 superpowers와 연결.
  - window-ook 20개: `idea-plan → prd → persona-research`, `sync-dev → my-pr` 등.
  - 양방향 무결성은 lint로 검증 후 누락 보강.
- A2. **`triggers.keywords` 추출** (반자동)
  - 현재 description 본문에서 따옴표 묶인 한국어/영어 키워드 추출.
  - 추출 결과를 사람이 검수 후 frontmatter에 반영.
  - description 본문은 유지 (모델 자동 호출 호환성).
  - 대상: `monitor-tanstack`, `monitor-zustand`, `office-hours`, `sync-dev`, `slack-daily-worklog` 등 키워드가 명시적으로 박힌 skill 우선.

### Track B — cheatsheet 플러그인 확장

#### B1. 파싱 확장 — `src/scanner.ts`

`HarnessItem` 타입을 확장:

```typescript
export type HarnessItem = {
  // ...기존 필드
  author?: string;
  relates?: string[];
  triggers?: {
    keywords?: string[];
  };
};
```

`parseItem` 함수에서 frontmatter 객체로부터 위 3개 필드를 안전하게 추출 (타입 검증, 빈 배열 필터링). webview/src/types.ts에도 동기화.

#### B2. UI — author 필터 (브라우징 뷰)

**배치 위치:**
- **`GroupFilter` 칩 줄에 author 칩을 그대로 섞어 노출** (`webview/src/components/GroupFilter.tsx`).
  - 기존: `[self] [plugin:feature-dev] [plugin:vercel] ...`
  - 추가 후: `[self] [plugin:feature-dev] [plugin:vercel] ... [author: superpowers(obra)] [author: impeccable(pbakaus)] [author: window-ook] [author: mattpocock] [author: gstack]`
  - 모드 토글은 **추가하지 않는다** — source 칩과 author 칩이 의미적으로 같은 차원("이 항목의 출처를 무엇으로 식별할지")이므로 한 줄에 평면적으로 둠.
  - 칩 라벨 prefix(`author:`)로 두 종류를 시각 구분. author 칩은 색상 토큰으로 한 번 더 구분.
- **Matrix 셀 내부 그룹 헤더 변경 없음**. 기존 namespace 그룹핑 유지.
- **상세 뷰**: §B3 와이어프레임 참조 (제목 아래 "생성자:" 한 줄).

**자료구조 보완:**
- `webview/src/types.ts`: 기존 `enabledGroups: Set<SourceGroupId>`를 그대로 쓰되 `SourceGroupId`에 `author:<author-string>` 케이스 추가.
- `sourceGroupIdFor`는 그대로 두고, 별도 `authorGroupIdFor(item)`도 enable 집합 후보에 합류.
- 필터 동작은 OR 합집합: `[self]` + `[author: obra]`를 모두 켜면 self인 것 또는 obra가 작성한 것 모두 표시. 동일 칩 줄이라 사용자가 직관적으로 받아들임.
- 색상은 `style.ts`의 토큰에 `authorAccents: Record<string, string>` 추가 (외부 출처 5개 고정 매핑, 그 외는 해시 기반).

#### B3. UI — author 표시 + relates 상호 링킹 (상세 뷰)

**상세 뷰 변경 — 위에서 아래 순서:**

1. **제목 아래에 "생성자:" 한 줄 추가** (NEW)
   - 제목과 기존 배지 줄 사이에 `생성자: superpowers(obra)` 형태의 단일 텍스트 줄.
   - 클릭/필터 동작 없음. 순수 표시만.
   - 스타일: 기존 `detailTitle` 다음 줄에 작은 secondary 텍스트.
2. **배지 줄 — 기존 그대로 유지** (변경 없음)
   - `[scope] [kind] [self/plugin] [namespace]` — author는 위 줄로 분리됐으니 배지에서 빠짐.
3. **Trigger Card — 행 구성 단순화**
   - `[호출]` 행: 기존 유지 (`/skill-name` + 파일 열기 버튼).
   - `[인자]` 행: **제거**. argument-hint 사용 안 함.
   - `[키워드]` 행: **신규 추가**. `triggers.keywords`를 칩으로 나열. 데이터 없으면 행 자체 비표시.
   - 카드 안에 `[호출]`만 남거나 `[호출]` + `[키워드]` 두 행만 존재.
4. **관련 스킬 카드** (NEW, Trigger Card 다음)
   - 카드 제목 `관련 스킬`.
   - 본문은 칩 그리드. **각 칩은 기존 `detailBadge` 스타일을 재사용**.
     - 칩 라벨 = related skill name (예: `executing-plans`).
     - 출처가 다르면 칩 색상으로 시각적 대비 (`authorAccents` 토큰 재사용).
     - 칩 자체가 button — 클릭 시 해당 skill의 상세 뷰로 이동.
   - 양방향 합집합 표시: A→B만 적혀 있어도 B의 상세 뷰에 A가 나타남.
   - `relatesIndex[slug]`가 비어 있으면 카드 자체 비표시.
5. **Content Card — 기존 그대로 유지**.

**자료구조:**
- 스캔 직후 한 번 `relatesIndex: Map<slugLowerCase, Set<slugLowerCase>>`를 양방향 합집합으로 빌드.
- `slug → HarnessItem` 룩업 인덱스(`itemBySlug`)도 함께 빌드 — 클릭 시 점프할 대상을 O(1)로 찾기.

**브라우징 뷰의 relates 표시 — 추가하지 않음**
- item 카드에 🔗 indicator는 시각적 부담 증가에 비해 가치 약함. 상세 뷰에 들어가야만 관련 정보를 볼 수 있게 동선 단순화.

#### B4. (없음 — triggers는 §B3의 Trigger Card 안 키워드 행과 검색 매칭 확장으로만 처리)

기존에 별도 섹션으로 두었던 "triggers 기반 추천"은 자동 추천 기능 자체를 빼기로 했으므로 제거.
`triggers.keywords`는 다음 두 곳에만 사용됨:
- 상세 뷰 Trigger Card의 `[키워드]` 행 (시각 표시)
- `webview/src/types.ts`의 `matchesQuery` 매칭 대상 확장 (검색 입력이 keywords 항목과도 매칭되도록)

자동 추천, 파일 패턴, `suggestForFile` 명령 모두 폐기.

#### B-WF. UI 와이어프레임 (배치 확인용)

**브라우징 뷰 (Matrix) — 헤더는 기존 그대로**

```
┌─ 헤더 (기존 그대로) ───────────────────────────────────────────────┐
│ ✴️ 치트시트  🔍 검색  [GroupFilter chips]  [다시 스캔]  [라이트/다크]│
└────────────────────────────────────────────────────────────────────┘

GroupFilter 안의 칩 한 줄 (확대):
┌───────────────────────────────────────────────────────────────────┐
│ scope:[user][project] kind:[skill][command][agent]                │
│ source/author:                                                    │
│   [self] [plugin:feature-dev] [plugin:vercel] ...                 │
│   [author: superpowers(obra)] [author: impeccable(pbakaus)]       │  ← NEW
│   [author: window-ook] [author: mattpocock] [author: gstack]      │  ← NEW
└───────────────────────────────────────────────────────────────────┘

Matrix 본체:
┌─ user.skills ─────────────────┐ ┌─ user.commands ────────┐ ┌─ user.agents ──┐
│ ▼ superpowers      [14]       │ │ ▼ window-ook    [22]   │ │ ▼ feature-dev  │
│   • brainstorming             │ │   • my-pr              │ │   • code-arch  │
│   • writing-plans             │ │   • my-gmcm            │ │   ...          │
│   ...                         │ │   ...                  │ │                │
│ ▼ impeccable       [10]       │ │                        │ │                │
│   • shape                     │ │                        │ │                │
│   ...                         │ │                        │ │                │
│ ▼ window-ook       [20]       │ │                        │ │                │
│   • prd                       │ │                        │ │                │
└───────────────────────────────┘ └────────────────────────┘ └────────────────┘
```

브라우징 뷰는 **헤더 칩에 author 종류만 추가**되고 그 외 변경 없음. 셀 내부 그룹/아이템 형태 그대로.

**상세 뷰 (DetailView) — 위에서 아래 순서**

```
┌─ ← 뒤로 ────────────────────────────────────────────────────────────┐
│                                                                     │
│ my:writing-plans                                                    │
│ 생성자: superpowers(obra)                              ← NEW (텍스트)│
│ [user] [skill] [self] [my:]                          ← 기존 그대로  │
│                                                                     │
│ ┌─ Trigger Card ─────────────────────────────────────────────────┐  │
│ │ 호출     /writing-plans                       [📂 파일 열기]    │  │
│ │ 키워드   (plan) (spec) (계획서) (요구사항)            ← NEW     │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│   (기존 '인자' 행은 제거)                                            │
│                                                                     │
│ ┌─ 관련 스킬 ───────────────────────────────────────────── NEW ──┐  │
│ │ [brainstorming]  [executing-plans]  [verification-before-...]   │  │
│ │ [subagent-driven-development]                                   │  │
│ │  ↑ 기존 detailBadge 스타일 재사용. 색상으로 다른 출처 구분.       │  │
│ └─────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│ ┌─ Content Card (markdown) ──────────────────────────────────────┐  │
│ │ # Writing Plans                                                 │  │
│ │ ...                                                             │  │
│ └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

세 변경점 결합도:
- author는 제목 아래 단순 텍스트 줄 (인터랙션 없음)
- triggers는 Trigger Card에 `[키워드]` 행 1개 추가, `[인자]` 행 제거
- relates는 새 카드, **기존 detailBadge 스타일 재사용**으로 시각 일관성 유지

검색 입력에서는 `triggers.keywords`도 매칭 대상에 포함 (현재 `matchesQuery`에 추가).

#### B5. Lint 명령 (3.5 참조)

`claudeHarnessCheatsheet.lint` 등록. output channel 사용.

### Track C — 문서화

C1. `docs/SCHEMA.md` 작성 (위 3.x 내용을 외부 사용자 친화적으로 정리).
C2. `README.md` 업데이트 — 새 기능 스크린샷, 스키마 링크.
C3. `CHANGELOG.md` v0.3.0 항목.

## 5. 빌드 순서

```
1. Track B1 (scanner 파싱 확장) → 검증: 새 필드가 webview까지 전달되는지
2. Track B2 (author 필터 칩) → 검증: author 필터 작동
3. Track A1 (relates 데이터 수집 — 46개 전수) → 검증: lint로 양방향 무결성 통과
4. Track A2 (triggers.keywords 추출 + 적용)
5. Track B3 (상세 뷰: 생성자 줄 + 키워드 행 + 관련 스킬 카드) → 검증: 양방향 링크 작동, 키워드 표시
6. Track B5 (lint 명령) → 검증: 누락된 양방향 링크 검출
7. Track C (문서화)
8. 패키징·배포 (v0.3.0)
```

각 단계는 다음 단계로 넘어가기 전에 cheatsheet를 실제로 열어 기능을 눈으로 확인한다.

## 6. 검증 체크리스트

배포 전 확인:

- [ ] author 필드가 비어 있는 skill을 cheatsheet가 "unknown" 그룹으로 안전하게 처리하는가
- [ ] `relates`에 존재하지 않는 slug가 적혀 있을 때 UI가 깨지지 않는가
- [ ] `triggers.keywords`에 비배열/빈 배열이 와도 안전하게 무시하는가
- [ ] 외부 사용자가 `author` 없이 skill을 만들어도 기존처럼 동작하는가 (모든 새 필드는 optional)
- [ ] lint 명령이 양방향 무결성·존재성을 정확히 검출하는가
- [ ] 기존 v0.2.x 사용자의 skill을 자동으로 마이그레이션하지 않아도 동작하는가 (backward compatible)

## 7. 오픈 이슈 / 후속 작업

- **모델용 별도 description 분리?** 장기적으로는 `description`을 사람용으로 짧게 다시 쓰고, 모델 트리거용 long-form은 별도 필드(`model-description` 또는 `invocation-hints`)로 빼는 게 깔끔. 이번 작업 범위에는 넣지 않음.
- **MEMORY.md 연동.** cheatsheet에서 author/relates 그래프를 memory와 연동하면 "이 skill을 마지막에 쓴 게 언제인가" 같은 정보도 표시 가능. v2 후보.
- **에코시스템 표준 PR.** SCHEMA.md가 자리잡으면 Anthropic의 skill authoring 가이드에 PR로 제안 (`author` 만이라도). v0.3.0 배포 후 사용 데이터 모으고 결정.

## 8. 변경되는 파일 (요약)

cheatsheet 저장소:
- `src/scanner.ts` — 파싱 확장
- `src/extension.ts` — `lint` 명령 등록
- `webview/src/types.ts` — 타입·헬퍼 함수 추가, matchesQuery 확장
- `webview/src/App.tsx` — author 필터 enable 집합 확장
- `webview/src/components/GroupFilter.tsx` — author 칩 추가
- `webview/src/components/DetailView.tsx` — 생성자 줄, 키워드 행, 관련 스킬 카드
- `webview/src/style.ts` — authorAccents 토큰
- `package.json` — lint 명령 등록, 버전 0.3.0
- `docs/SCHEMA.md` — 신규
- `README.md`, `CHANGELOG.md` — 업데이트

skill 저장소(`~/.claude/skills/`):
- 46개 SKILL.md에 `relates` 추가 (작업량 큼)
- 일부 SKILL.md에 `triggers.keywords` 추가 (15~20개 예상)
