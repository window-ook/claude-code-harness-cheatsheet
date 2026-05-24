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
