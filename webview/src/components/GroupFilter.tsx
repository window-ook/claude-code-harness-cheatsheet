import { useEffect, useRef, useState } from 'react';
import { Filter } from 'lucide-react';
import { cssObj, tokensFor } from '../style';
import {
  KINDS,
  KIND_LABEL,
  SCOPES,
  SCOPE_LABEL,
  sourceGroupLabel,
  type Kind,
  type Scope,
  type SourceGroupId,
  type Theme,
} from '../types';

type Props = {
  theme: Theme;
  groups: SourceGroupId[];
  groupCounts: Record<SourceGroupId, number>;
  enabledGroups: Set<SourceGroupId>;
  onChangeGroups: (next: Set<SourceGroupId>) => void;
  scopeCounts: Record<Scope, number>;
  enabledScopes: Set<Scope>;
  onChangeScopes: (next: Set<Scope>) => void;
  kindCounts: Record<Kind, number>;
  enabledKinds: Set<Kind>;
  onChangeKinds: (next: Set<Kind>) => void;
};

export function GroupFilter({
  theme,
  groups,
  groupCounts,
  enabledGroups,
  onChangeGroups,
  scopeCounts,
  enabledScopes,
  onChangeScopes,
  kindCounts,
  enabledKinds,
  onChangeKinds,
}: Props) {
  const t = tokensFor(theme);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current?.contains(e.target as Node)) return;
      if (panelRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPanelPos(null);
      return;
    }
    const update = () => {
      const btn = buttonRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 6, left: rect.left });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open]);

  const totalHidden =
    groups.length - enabledGroups.size +
    SCOPES.length - enabledScopes.size +
    KINDS.length - enabledKinds.size;
  const hasAnyFilter = totalHidden > 0;

  const toggle = <T,>(set: Set<T>, value: T, apply: (next: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    apply(next);
  };

  const selectAll = () => {
    onChangeGroups(new Set(groups));
    onChangeScopes(new Set(SCOPES));
    onChangeKinds(new Set(KINDS));
  };
  const selectNone = () => {
    onChangeGroups(new Set());
    onChangeScopes(new Set());
    onChangeKinds(new Set());
  };

  return (
    <div ref={containerRef} css={cssObj.groupFilterWrap(t)}>
      <button
        ref={buttonRef}
        type="button"
        css={cssObj.groupFilterToggle(t, hasAnyFilter)}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Filter size={14} /> 필터
        {hasAnyFilter ? (
          <span css={cssObj.groupFilterBadge(t)}>{totalHidden} 숨김</span>
        ) : null}
      </button>
      {open && panelPos ? (
        <div
          ref={panelRef}
          css={cssObj.groupFilterPanel(t)}
          style={{ top: panelPos.top, left: panelPos.left }}
        >
          <div css={cssObj.groupFilterActionRow(t)}>
            <button
              type="button"
              css={cssObj.groupFilterActionButton(t)}
              onClick={selectAll}
            >
              전체 선택
            </button>
            <button
              type="button"
              css={cssObj.groupFilterActionButton(t)}
              onClick={selectNone}
            >
              전체 해제
            </button>
          </div>

          <div css={cssObj.groupFilterSectionLabel(t)}>스코프</div>
          {SCOPES.map((s) => (
            <label key={s} css={cssObj.groupFilterRow(t)}>
              <input
                type="checkbox"
                css={cssObj.groupFilterCheckbox(t)}
                checked={enabledScopes.has(s)}
                onChange={() => toggle(enabledScopes, s, onChangeScopes)}
              />
              <span>{SCOPE_LABEL[s]}</span>
              <span css={cssObj.groupFilterCount(t)}>{scopeCounts[s] ?? 0}</span>
            </label>
          ))}

          <div css={cssObj.groupFilterSectionLabel(t)}>종류</div>
          {KINDS.map((k) => (
            <label key={k} css={cssObj.groupFilterRow(t)}>
              <input
                type="checkbox"
                css={cssObj.groupFilterCheckbox(t)}
                checked={enabledKinds.has(k)}
                onChange={() => toggle(enabledKinds, k, onChangeKinds)}
              />
              <span>{KIND_LABEL[k]}</span>
              <span css={cssObj.groupFilterCount(t)}>{kindCounts[k] ?? 0}</span>
            </label>
          ))}

          <div css={cssObj.groupFilterSectionLabel(t)}>출처</div>
          {groups.map((id) => (
            <label key={id} css={cssObj.groupFilterRow(t)}>
              <input
                type="checkbox"
                css={cssObj.groupFilterCheckbox(t)}
                checked={enabledGroups.has(id)}
                onChange={() => toggle(enabledGroups, id, onChangeGroups)}
              />
              <span>{sourceGroupLabel(id)}</span>
              <span css={cssObj.groupFilterCount(t)}>{groupCounts[id] ?? 0}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}
