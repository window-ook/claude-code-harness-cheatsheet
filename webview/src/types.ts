export type Scope = 'user' | 'project';
export type Kind = 'skills' | 'commands' | 'agents';
export type Bucket = `${Scope}.${Kind}`;
export type Source = 'self' | 'plugin';
export type Theme = 'dark' | 'light';

export type HarnessItem = {
  name: string;
  description: string;
  namespace: string;
  source: Source;
  pluginName?: string;
  isSubAsset?: boolean;
  filePath?: string;
  kind?: Kind;
  scope?: Scope;
};

export type HarnessData = {
  generatedAt: string;
  buckets: Record<Bucket, HarnessItem[]>;
};

export const SCOPES: Scope[] = ['user', 'project'];
export const KINDS: Kind[] = ['skills', 'commands', 'agents'];

export const SCOPE_LABEL: Record<Scope, string> = {
  user: '유저',
  project: '프로젝트',
};

export const KIND_LABEL: Record<Kind, string> = {
  skills: '스킬',
  commands: '커맨드',
  agents: '에이전트',
};

export type Group = {
  key: string;
  namespace: string;
  source: Source;
  pluginName?: string;
  items: HarnessItem[];
};

export function matchesQuery(item: HarnessItem, q: string): boolean {
  if (!q) return true;
  const needle = q.toLowerCase();
  if (item.name.toLowerCase().includes(needle)) return true;
  if (item.description.toLowerCase().includes(needle)) return true;
  if (item.namespace.toLowerCase().includes(needle)) return true;
  if (item.pluginName && item.pluginName.toLowerCase().includes(needle)) return true;
  return false;
}

export function filterItems(items: HarnessItem[], q: string): HarnessItem[] {
  if (!q) return items;
  return items.filter((it) => matchesQuery(it, q));
}

export function groupItems(items: HarnessItem[]): Group[] {
  const map = new Map<string, Group>();
  for (const item of items) {
    const key = groupKeyFor(item);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(key, {
        key,
        namespace: item.namespace,
        source: item.source,
        pluginName: item.pluginName,
        items: [item],
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.source !== b.source) return a.source === 'self' ? -1 : 1;
    const pa = a.pluginName ?? '';
    const pb = b.pluginName ?? '';
    if (pa !== pb) return pa.localeCompare(pb);
    return a.namespace.localeCompare(b.namespace);
  });
}

export const SINGLE_FILE_NAMESPACE = '__single__';
export const SINGLE_FILE_NAMESPACE_LABEL = '';

export function isSingleFileNamespace(namespace: string): boolean {
  return namespace === SINGLE_FILE_NAMESPACE;
}

export type GroupKey = string;

export type SourceGroupId = string;

export function sourceGroupIdFor(item: Pick<HarnessItem, 'source' | 'pluginName'>): SourceGroupId {
  return item.source === 'self' ? 'self' : `plugin:${item.pluginName ?? ''}`;
}

export function sourceGroupLabel(id: SourceGroupId): string {
  if (id === 'self') return 'self';
  return id.replace(/^plugin:/, '');
}

export function groupKeyFor(item: { source: Source; pluginName?: string; namespace: string }): GroupKey {
  return `${item.source}::${item.pluginName ?? ''}::${item.namespace}`;
}

export function defaultExpandedFor(source: Source): boolean {
  return source === 'self';
}
