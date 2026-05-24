# Claude Harness Cheatsheet (VSCode/Cursor Extension)

IDE 안에서 `Cmd + /` 한 번으로 Claude Code의 스킬·커맨드·에이전트를 매트릭스로 확인.

## 무엇을 보여주나

`~/.claude/`와 현재 워크스페이스의 `.claude/`를 스캔해서 다음 6개 셀로 구성된 매트릭스를 표시합니다.

|  | 스킬 | 커맨드 | 에이전트 |
|---|---|---|---|
| **유저** | `~/.claude/skills` + 플러그인 캐시 | `~/.claude/commands` + 플러그인 | `~/.claude/agents` + 플러그인 |
| **프로젝트** | `<repo>/.claude/skills` | `<repo>/.claude/commands` | `<repo>/.claude/agents` |

## 개발

```bash
pnpm install
cd webview && pnpm install && cd ..
pnpm build         # extension + webview 모두 빌드
```

### F5로 실행

VSCode에서 이 폴더를 열고 `F5` → "Run Extension" → 새 창에서 `Cmd + /` 토글.

### VSIX 패키징

```bash
pnpm package       # claude-harness-cheatsheet-0.1.0.vsix 생성
```

설치:
```bash
code --install-extension claude-harness-cheatsheet-0.1.0.vsix
# Cursor도 동일:
cursor --install-extension claude-harness-cheatsheet-0.1.0.vsix
```

## 단축키

- `Cmd + /` (mac) / `Ctrl + /` (win/linux) — 토글
- 패널이 떠 있을 때 우측 상단의 `↻ 다시 스캔` 버튼으로 수동 리프레시
- `☀ / 🌙` 버튼으로 라이트/다크 전환 (localStorage 저장)

> 기본 키바인딩은 에디터에 포커스가 없을 때만 활성화됩니다 (`when: !editorFocus`). 에디터 라인 주석 단축키와 충돌하지 않게 하기 위함입니다. 충돌이 없다면 `keybindings.json`에서 `when` 조건을 지우세요.

## 동작 원리

```
Cmd + /
   │
   ▼
extension.ts (activate)
   │
   ├─ scanner.ts → ~/.claude/* + <workspace>/.claude/* 워크
   │                ↓
   │              HarnessData (JSON)
   │
   ▼
WebviewPanel 생성 → postMessage('harness/data', data)
   │
   ▼
Vite-built React (webview/dist/) → Matrix 렌더
```

## 의존성

| 영역 | 패키지 | 용도 |
|---|---|---|
| extension host | `gray-matter`, `js-yaml` | SKILL.md frontmatter 파싱 |
| webview | `react`, `@emotion/react` | UI |
| build | `typescript`, `vite`, `@vscode/vsce` | 빌드 + 패키징 |
