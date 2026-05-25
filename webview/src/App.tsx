import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Global, css } from '@emotion/react';
import { cssObj, tokensFor } from './style';
import { Matrix } from './components/Matrix';
import { DetailView, type DetailFile } from './components/DetailView';
import { GroupFilter } from './components/GroupFilter';
import {
  KINDS,
  KIND_LABEL,
  SCOPES,
  SCOPE_LABEL,
  authorIdFor,
  buildItemBySlug,
  buildRelatesIndex,
  filterItems,
  sourceGroupIdFor,
  type Bucket,
  type HarnessData,
  type HarnessItem,
  type Kind,
  type RelatesIndex,
  type Scope,
  type SourceGroupId,
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
    __HARNESS_ASSET_BASE__?: string;
  }
}

const STORAGE_KEY = 'harness-cheatsheet-theme';

function resolveAsset(file: string): string {
  const base = window.__HARNESS_ASSET_BASE__;
  if (base) return `${base}/${file}`;
  return `./${file}`;
}

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

  const [selected, setSelected] = useState<HarnessItem | null>(null);
  const [detailFiles, setDetailFiles] = useState<DetailFile[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const pendingDetailReqRef = useRef<string | null>(null);

  const [enabledGroups, setEnabledGroups] = useState<Set<SourceGroupId>>(new Set());
  const groupsInitializedRef = useRef(false);
  const [enabledScopes, setEnabledScopes] = useState<Set<Scope>>(() => new Set<Scope>(SCOPES));
  const [enabledKinds, setEnabledKinds] = useState<Set<Kind>>(() => new Set<Kind>(KINDS));
  const [enabledAuthors, setEnabledAuthors] = useState<Set<string>>(new Set());
  const authorsInitializedRef = useRef(false);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'harness/data' && msg.data) {
        setData(msg.data as HarnessData);
        setError(null);
      } else if (msg.type === 'harness/error') {
        setError(String(msg.message ?? 'unknown error'));
      } else if (msg.type === 'harness/detail') {
        if (msg.requestId !== pendingDetailReqRef.current) return;
        setDetailFiles((msg.files ?? []) as DetailFile[]);
        setDetailLoading(false);
        setDetailError(null);
      } else if (msg.type === 'harness/detailError') {
        if (msg.requestId !== pendingDetailReqRef.current) return;
        setDetailLoading(false);
        setDetailError(String(msg.message ?? 'unknown error'));
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

  const { groupIds, groupCounts } = useMemo(() => {
    if (!data) return { groupIds: [] as SourceGroupId[], groupCounts: {} as Record<SourceGroupId, number> };
    const counts: Record<SourceGroupId, number> = {};
    const order: SourceGroupId[] = [];
    for (const scope of SCOPES) {
      for (const kind of KINDS) {
        const key = `${scope}.${kind}` as Bucket;
        for (const item of data.buckets[key] ?? []) {
          const id = sourceGroupIdFor(item);
          if (counts[id] === undefined) {
            counts[id] = 0;
            order.push(id);
          }
          counts[id] += 1;
        }
      }
    }
    order.sort((a, b) => {
      if (a === 'self') return -1;
      if (b === 'self') return 1;
      return a.localeCompare(b);
    });
    return { groupIds: order, groupCounts: counts };
  }, [data]);

  const allItems = useMemo<HarnessItem[]>(() => {
    if (!data) return [];
    const out: HarnessItem[] = [];
    for (const scope of SCOPES) {
      for (const kind of KINDS) {
        const key = `${scope}.${kind}` as Bucket;
        out.push(...(data.buckets[key] ?? []));
      }
    }
    return out;
  }, [data]);

  const relatesIndex = useMemo<RelatesIndex>(() => buildRelatesIndex(allItems), [allItems]);
  const itemBySlug = useMemo(() => buildItemBySlug(allItems), [allItems]);

  const { authorIds, authorCounts } = useMemo(() => {
    if (!data) return { authorIds: [] as string[], authorCounts: {} as Record<string, number> };
    const counts: Record<string, number> = {};
    const order: string[] = [];
    for (const scope of SCOPES) {
      for (const kind of KINDS) {
        const key = `${scope}.${kind}` as Bucket;
        for (const item of data.buckets[key] ?? []) {
          const id = authorIdFor(item);
          if (counts[id] === undefined) {
            counts[id] = 0;
            order.push(id);
          }
          counts[id] += 1;
        }
      }
    }
    order.sort((a, b) => a.localeCompare(b));
    return { authorIds: order, authorCounts: counts };
  }, [data]);

  useEffect(() => {
    if (!data) return;
    if (!groupsInitializedRef.current) {
      setEnabledGroups(new Set(groupIds));
      groupsInitializedRef.current = true;
      return;
    }
    setEnabledGroups((prev) => {
      const known = new Set(groupIds);
      let changed = false;
      const next = new Set<SourceGroupId>();
      for (const id of prev) {
        if (known.has(id)) next.add(id);
        else changed = true;
      }
      const knownInPrev = new Set(prev);
      for (const id of groupIds) {
        if (!knownInPrev.has(id) && prev.size > 0 && prev.size === knownInPrev.size) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [data, groupIds]);

  useEffect(() => {
    if (!data) return;
    if (!authorsInitializedRef.current) {
      setEnabledAuthors(new Set(authorIds));
      authorsInitializedRef.current = true;
      return;
    }
    setEnabledAuthors((prev) => {
      const known = new Set(authorIds);
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (known.has(id)) next.add(id);
        else changed = true;
      }
      const knownInPrev = new Set(prev);
      for (const id of authorIds) {
        if (!knownInPrev.has(id) && prev.size > 0 && prev.size === knownInPrev.size) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [data, authorIds]);

  const filteredData = useMemo<HarnessData | null>(() => {
    if (!data) return null;
    const buckets = {} as HarnessData['buckets'];
    for (const scope of SCOPES) {
      const scopeOn = enabledScopes.has(scope);
      for (const kind of KINDS) {
        const key = `${scope}.${kind}` as Bucket;
        const kindOn = enabledKinds.has(kind);
        const all = data.buckets[key] ?? [];
        if (!scopeOn || !kindOn) {
          buckets[key] = [];
          continue;
        }
        buckets[key] = all.filter((it) =>
          enabledGroups.has(sourceGroupIdFor(it)) && enabledAuthors.has(authorIdFor(it)),
        );
      }
    }
    return { generatedAt: data.generatedAt, buckets };
  }, [data, enabledGroups, enabledScopes, enabledKinds, enabledAuthors]);

  const summary = useMemo(() => computeSummary(filteredData, query), [filteredData, query]);

  const scopeCounts = useMemo(() => {
    const out = { user: 0, project: 0 } as Record<Scope, number>;
    if (!data) return out;
    for (const scope of SCOPES) {
      for (const kind of KINDS) {
        out[scope] += (data.buckets[`${scope}.${kind}` as Bucket] ?? []).length;
      }
    }
    return out;
  }, [data]);

  const kindCounts = useMemo(() => {
    const out = { skills: 0, commands: 0, agents: 0 } as Record<Kind, number>;
    if (!data) return out;
    for (const scope of SCOPES) {
      for (const kind of KINDS) {
        out[kind] += (data.buckets[`${scope}.${kind}` as Bucket] ?? []).length;
      }
    }
    return out;
  }, [data]);

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

  const selectItem = useCallback(
    (item: HarnessItem) => {
      if (!item.filePath) return;
      setSelected(item);
      setDetailFiles(null);
      setDetailError(null);
      setDetailLoading(true);
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      pendingDetailReqRef.current = requestId;
      vscodeApi?.postMessage({
        type: 'harness/openDetail',
        filePath: item.filePath,
        requestId,
        kind: item.kind,
      });
    },
    [vscodeApi],
  );

  const handleSelectFromMatrix = useCallback(
    (filePath: string) => {
      if (!data) return;
      for (const scope of SCOPES) {
        for (const kind of KINDS) {
          const key = `${scope}.${kind}` as Bucket;
          const items = data.buckets[key] ?? [];
          const found = items.find((it) => it.filePath === filePath);
          if (found) {
            selectItem(found);
            return;
          }
        }
      }
    },
    [data, selectItem],
  );

  const backToMatrix = useCallback(() => {
    setSelected(null);
    setDetailFiles(null);
    setDetailError(null);
    setDetailLoading(false);
    pendingDetailReqRef.current = null;
  }, []);

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
      <Global
        styles={css`
          html, body {
            background: ${t.bg};
            color: ${t.textPrimary};
            margin: 0;
          }
          *, *::before, *::after {
            scrollbar-width: thin;
            scrollbar-color: ${t.border} ${t.bg};
          }
          *::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          *::-webkit-scrollbar-track {
            background: ${t.bg};
          }
          *::-webkit-scrollbar-thumb {
            background: ${t.border};
            border: 2px solid ${t.bg};
            border-radius: 5px;
          }
          *::-webkit-scrollbar-thumb:hover {
            background: ${t.textTertiary};
          }
          *::-webkit-scrollbar-corner {
            background: ${t.bg};
          }
        `}
      />
      <div css={cssObj.shell(t)}>
        <div css={cssObj.header(t)}>
          {logoFailed ? (
            <span css={cssObj.headerTitle(t)}>✴️ 클로드 코드 하네스 치트 시트</span>
          ) : (
            <>
              <img
                src={resolveAsset('icon.png')}
                alt="logo"
                css={cssObj.logo}
                onError={() => setLogoFailed(true)}
              />
              <span css={cssObj.headerTitle(t)}>클로드 코드 하네스 치트 시트</span>
            </>
          )}
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
              placeholder="⌘F 또는 / 로 검색 (이름·설명·네임스페이스)"
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
          {data && groupIds.length > 0 ? (
            <GroupFilter
              theme={theme}
              groups={groupIds}
              groupCounts={groupCounts}
              enabledGroups={enabledGroups}
              onChangeGroups={setEnabledGroups}
              scopeCounts={scopeCounts}
              enabledScopes={enabledScopes}
              onChangeScopes={setEnabledScopes}
              kindCounts={kindCounts}
              enabledKinds={enabledKinds}
              onChangeKinds={setEnabledKinds}
              authors={authorIds}
              authorCounts={authorCounts}
              enabledAuthors={enabledAuthors}
              onChangeAuthors={setEnabledAuthors}
            />
          ) : null}
          <button type="button" css={cssObj.refreshButton(t)} onClick={refresh}>
            <RefreshIcon size={14} /> 다시 스캔
          </button>
          {renderSummary()}
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
        ) : selected ? (
          <DetailView
            item={selected}
            theme={theme}
            files={detailFiles}
            loading={detailLoading}
            error={detailError}
            onBack={backToMatrix}
            onOpen={openFile}
            relatesIndex={relatesIndex}
            itemBySlug={itemBySlug}
            onSelectRelated={selectItem}
          />
        ) : filteredData ? (
          <Matrix
            data={filteredData}
            theme={theme}
            query={query}
            collapse={collapse}
            onOpen={handleSelectFromMatrix}
          />
        ) : (
          <div css={cssObj.loading(t)}>스캔 중…</div>
        )}
      </div>
    </div>
  );
}
