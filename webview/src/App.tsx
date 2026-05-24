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
