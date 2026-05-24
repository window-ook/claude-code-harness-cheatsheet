import { useEffect, useRef, useState } from 'react';
import { cssObj, tokensFor } from './style';
import { Matrix } from './components/Matrix';
import { filterItems, type HarnessData, type Theme } from './types';

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

export function App() {
  const [data, setData] = useState<HarnessData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const [query, setQuery] = useState('');
  const [vscodeApi] = useState(() => (window.acquireVsCodeApi ? window.acquireVsCodeApi() : null));
  const searchRef = useRef<HTMLInputElement>(null);

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

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

  const refresh = () => vscodeApi?.postMessage({ type: 'harness/refresh' });
  const openFile = (filePath: string) => vscodeApi?.postMessage({ type: 'harness/openFile', filePath });

  const totalCount = data ? Object.values(data.buckets).reduce((sum, arr) => sum + arr.length, 0) : 0;
  const filteredCount =
    data && query
      ? Object.values(data.buckets).reduce((sum, arr) => sum + filterItems(arr, query).length, 0)
      : totalCount;
  const isFiltering = query.length > 0;

  return (
    <div css={cssObj.root(t)}>
      <div css={cssObj.header(t)}>
        <span css={cssObj.headerTitle(t)}>✴️ 클로드 코드 하네스 치트 시트</span>
        {data ? (
          <>
            <span>
              {isFiltering ? (
                <>
                  {filteredCount} / {totalCount}개
                </>
              ) : (
                <>총 {totalCount}개 발견</>
              )}
            </span>
            <span>•</span>
            <span>({formatGeneratedAt(data.generatedAt)} 기준)</span>
          </>
        ) : null}
        <div css={cssObj.searchWrap(t)}>
          <span css={cssObj.searchIcon(t)}>🔍</span>
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
              ×
            </button>
          ) : null}
        </div>
        <span css={cssObj.searchHint(t)}>⌘F · /</span>
        <button type="button" css={cssObj.refreshButton(t)} onClick={refresh}>
          ↻ 다시 스캔
        </button>
        <button type="button" css={cssObj.themeToggle(t)} onClick={toggleTheme} aria-label="테마 전환">
          {theme === 'dark' ? '☀ 라이트' : '🌙 다크'}
        </button>
      </div>
      {error ? (
        <div css={cssObj.loading(t)}>오류: {error}</div>
      ) : data ? (
        <Matrix data={data} theme={theme} query={query} onOpen={openFile} />
      ) : (
        <div css={cssObj.loading(t)}>스캔 중…</div>
      )}
    </div>
  );
}
