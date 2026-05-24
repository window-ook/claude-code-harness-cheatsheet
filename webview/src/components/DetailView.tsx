import { useEffect, useState } from 'react';
import { cssObj, tokensFor } from '../style';
import { MarkdownView } from './MarkdownView';
import { ChevronIcon } from './Icons';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import {
  KIND_LABEL,
  SCOPE_LABEL,
  isSingleFileNamespace,
  type HarnessItem,
  type RelatesIndex,
  type Theme,
} from '../types';

export type DetailFile = {
  name: string;
  fileName: string;
  filePath: string;
  content: string;
  frontmatter: Record<string, unknown>;
};

type Props = {
  item: HarnessItem;
  theme: Theme;
  files: DetailFile[] | null;
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onOpen: (filePath: string) => void;
  relatesIndex: RelatesIndex;
  itemBySlug: Map<string, HarnessItem>;
  onSelectRelated: (item: HarnessItem) => void;
};

function asString(v: unknown): string | undefined {
  if (typeof v === 'string') return v.trim() || undefined;
  return undefined;
}

function asBool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const lower = v.trim().toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  return undefined;
}

export function DetailView({
  item,
  theme,
  files,
  loading,
  error,
  onBack,
  onOpen,
  relatesIndex,
  itemBySlug,
  onSelectRelated,
}: Props) {
  const t = tokensFor(theme);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    setActiveIdx(0);
  }, [item.filePath]);

  const active = files && files.length > 0 ? files[Math.min(activeIdx, files.length - 1)] : null;
  const fm = active?.frontmatter ?? {};
  const kind = item.kind;
  const displayName = asString(fm.name) ?? item.name;

  const triggerKeywords = (() => {
    const triggers = fm.triggers;
    if (!triggers || typeof triggers !== 'object' || Array.isArray(triggers)) return item.triggers?.keywords ?? [];
    const kw = (triggers as Record<string, unknown>).keywords;
    if (!Array.isArray(kw)) return item.triggers?.keywords ?? [];
    return kw.filter((s): s is string => typeof s === 'string' && s.trim().length > 0);
  })();

  const disableModelInvocation = asBool(fm['disable-model-invocation']) ?? asBool(fm.disableModelInvocation);
  const isAgent = kind === 'agents';
  const isSelf = item.source === 'self';

  const relatedSlugs = (() => {
    const set = relatesIndex.get(item.name);
    if (!set) return [] as string[];
    return Array.from(set).sort();
  })();
  const relatedItems = relatedSlugs
    .map((slug) => ({ slug, item: itemBySlug.get(slug) }))
    .filter((r): r is { slug: string; item: HarnessItem } => !!r.item);
  const orphanSlugs = relatedSlugs.filter((slug) => !itemBySlug.has(slug));

  return (
    <div css={cssObj.detailRoot(t)}>
      <div css={cssObj.detailBackBar(t)}>
        <button type="button" css={cssObj.detailBackButton(t)} onClick={onBack} aria-label="뒤로">
          <ChevronLeft size={14} /> 뒤로
        </button>
      </div>

      <div css={cssObj.detailHeader(t)}>
        <div css={cssObj.detailTitle(t)}>{displayName}</div>
        {item.author ? (
          <div css={cssObj.detailAuthorLine(t)}>생성자: {item.author}</div>
        ) : null}
        <div css={cssObj.detailBadges}>
          <span css={cssObj.detailBadge(t, 'scope')}>{SCOPE_LABEL[item.scope ?? 'user']}</span>
          <span css={cssObj.detailBadge(t, 'kind')}>{kind ? KIND_LABEL[kind] : '-'}</span>
          {isSelf ? (
            <span css={cssObj.detailBadge(t, 'self')}>직접</span>
          ) : (
            <span css={cssObj.detailBadge(t, 'plugin')}>{item.pluginName ?? 'plugin'}</span>
          )}
          {item.namespace && !isSingleFileNamespace(item.namespace) ? (
            <span css={cssObj.detailBadge(t, 'scope')}>{item.namespace}</span>
          ) : null}
        </div>
      </div>

      <div css={cssObj.detailTriggerCard(t)}>
        {isAgent ? (
          <div css={cssObj.detailTriggerRow(t)}>
            <span css={cssObj.detailTriggerLabel(t)}>호출</span>
            {disableModelInvocation ? (
              <span css={cssObj.detailTriggerNo(t)}>🚫 에이전트 자동 호출 불가</span>
            ) : (
              <span css={cssObj.detailTriggerOk(t)}>✅ 에이전트 자동 호출 가능</span>
            )}
            <button
              type="button"
              css={cssObj.detailOpenButton(t)}
              onClick={() => active && onOpen(active.filePath)}
              disabled={!active}
            >
              <ExternalLink size={14} /> 파일 열기
            </button>
          </div>
        ) : (
          <div css={cssObj.detailTriggerRow(t)}>
            <span css={cssObj.detailTriggerLabel(t)}>호출</span>
            <span css={cssObj.detailTriggerValue(t)}>/{displayName}</span>
            <button
              type="button"
              css={cssObj.detailOpenButton(t)}
              onClick={() => active && onOpen(active.filePath)}
              disabled={!active}
            >
              <ExternalLink size={14} /> 파일 열기
            </button>
          </div>
        )}

        {triggerKeywords.length > 0 ? (
          <div css={cssObj.detailTriggerRow(t)}>
            <span css={cssObj.detailTriggerLabel(t)}>키워드</span>
            {triggerKeywords.map((kw, i) => (
              <span key={`${kw}-${i}`} css={cssObj.detailTriggerValue(t)}>
                {kw}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {relatedItems.length > 0 || orphanSlugs.length > 0 ? (
        <div css={cssObj.detailRelatedCard(t)}>
          <div css={cssObj.detailRelatedTitle(t)}>관련 스킬</div>
          <div css={cssObj.detailRelatedChips(t)}>
            {relatedItems.map(({ slug, item: rel }) => (
              <button
                key={slug}
                type="button"
                css={cssObj.detailRelatedChip(t, rel.author)}
                onClick={() => onSelectRelated(rel)}
                title={rel.description}
              >
                {rel.name}
              </button>
            ))}
            {orphanSlugs.map((slug) => (
              <span key={slug} css={cssObj.detailRelatedOrphan(t)} title="대상 스킬을 찾지 못했습니다">
                {slug}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div css={cssObj.detailContentCard(t)}>
        {loading ? (
          <div css={cssObj.detailLoading(t)}>로딩 중…</div>
        ) : error ? (
          <div css={cssObj.detailLoading(t)}>오류: {error}</div>
        ) : files && files.length > 0 ? (
          <>
            {files.length > 1 ? (
              <div css={cssObj.detailTabBar(t)}>
                {files.map((f, i) => (
                  <button
                    key={f.filePath}
                    type="button"
                    css={cssObj.detailTab(t, i === activeIdx)}
                    onClick={() => setActiveIdx(i)}
                    title={f.filePath}
                  >
                    <ChevronIcon expanded={i === activeIdx} size={10} /> {f.fileName}
                  </button>
                ))}
              </div>
            ) : null}
            {active ? <MarkdownView source={active.content} theme={theme} /> : null}
          </>
        ) : (
          <div css={cssObj.detailLoading(t)}>표시할 문서가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
