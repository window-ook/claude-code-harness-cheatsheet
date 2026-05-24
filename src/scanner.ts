import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const matterOptions = {
  engines: {
    yaml: {
      parse: (input: string) => yaml.load(input) as object,
      stringify: (input: object) => yaml.dump(input),
    },
  },
};

export type Scope = 'user' | 'project';
export type Kind = 'skills' | 'commands' | 'agents';
export type Source = 'self' | 'plugin';

export type HarnessItem = {
  name: string;
  description: string;
  namespace: string;
  source: Source;
  pluginName?: string;
  isSubAsset?: boolean;
  filePath: string;
  kind: Kind;
  scope: Scope;
};

export type Bucket = `${Scope}.${Kind}`;
export type HarnessData = {
  generatedAt: string;
  buckets: Record<Bucket, HarnessItem[]>;
};

type BaseRef = {
  dir: string;
  source: Source;
  pluginName?: string;
};

const PRIMARY_FILES = new Set(['SKILL.md', 'COMMAND.md', 'AGENT.md']);
const KINDS: Kind[] = ['skills', 'commands', 'agents'];

const HOME = os.homedir();
const USER_BASE = path.join(HOME, '.claude');
const USER_PLUGIN_CACHE = path.join(USER_BASE, 'plugins', 'cache');

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function listMarkdownFiles(dir: string): Promise<string[]> {
  if (!(await pathExists(dir))) return [];
  const out: string[] = [];
  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        out.push(full);
      }
    }
  }
  await walk(dir);
  return out;
}

function deriveNamespace(filePath: string, baseDir: string): string {
  const rel = path.relative(baseDir, filePath);
  const segments = rel.split(path.sep);
  if (segments.length <= 1) return '(root)';
  return segments[0];
}

function firstLine(text: string): string {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return '';
  const idx = trimmed.indexOf('\n');
  return idx === -1 ? trimmed : trimmed.slice(0, idx).trim();
}

async function parseItem(
  filePath: string,
  kindDir: string,
  ref: BaseRef,
  kind: Kind,
  scope: Scope,
): Promise<HarnessItem | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const parsed = matter(raw, matterOptions);
    const fm = (parsed.data ?? {}) as Record<string, unknown>;
    const fileName = path.basename(filePath);
    const hasFrontmatterName = typeof fm.name === 'string' && (fm.name as string).trim().length > 0;
    const rawName = hasFrontmatterName
      ? (fm.name as string).trim()
      : path.basename(filePath, '.md');
    const name = firstLine(rawName);
    const description = firstLine(typeof fm.description === 'string' ? (fm.description as string) : '');
    const namespace = deriveNamespace(filePath, kindDir);
    const isPrimary = PRIMARY_FILES.has(fileName) || hasFrontmatterName;
    const isSubAsset = !isPrimary && namespace !== '(root)';
    return {
      name,
      description,
      namespace,
      source: ref.source,
      ...(ref.pluginName ? { pluginName: ref.pluginName } : {}),
      ...(isSubAsset ? { isSubAsset: true } : {}),
      filePath,
      kind,
      scope,
    };
  } catch {
    return null;
  }
}

async function collectKind(refs: BaseRef[], kind: Kind, scope: Scope): Promise<HarnessItem[]> {
  const items: HarnessItem[] = [];
  const seen = new Set<string>();
  for (const ref of refs) {
    const kindDir = path.join(ref.dir, kind);
    const files = await listMarkdownFiles(kindDir);
    for (const file of files) {
      const item = await parseItem(file, kindDir, ref, kind, scope);
      if (!item) continue;
      const dedupeKey = `${item.source}:${item.pluginName ?? ''}:${item.namespace}/${item.name}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      items.push(item);
    }
  }
  return items;
}

function derivePluginName(baseDir: string): string {
  const rel = path.relative(USER_PLUGIN_CACHE, baseDir);
  const segments = rel.split(path.sep);
  if (segments.length === 0) return rel;
  if (segments.length === 1) return segments[0];
  return `${segments[0]}/${segments[1]}`;
}

async function listPluginCacheBases(): Promise<BaseRef[]> {
  if (!(await pathExists(USER_PLUGIN_CACHE))) return [];
  const bases: BaseRef[] = [];
  async function walk(current: string, depth: number) {
    if (depth > 4) return;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const full = path.join(current, entry.name);
      const hasKind = await Promise.all(KINDS.map((k) => pathExists(path.join(full, k))));
      if (hasKind.some(Boolean)) {
        bases.push({ dir: full, source: 'plugin', pluginName: derivePluginName(full) });
      }
      await walk(full, depth + 1);
    }
  }
  await walk(USER_PLUGIN_CACHE, 0);
  return bases;
}

export async function scanHarness(projectRoot?: string): Promise<HarnessData> {
  const pluginBases = await listPluginCacheBases();
  const userBases: BaseRef[] = [{ dir: USER_BASE, source: 'self' }, ...pluginBases];
  const projectBases: BaseRef[] = projectRoot
    ? [{ dir: path.join(projectRoot, '.claude'), source: 'self' }]
    : [];

  const buckets: Record<Bucket, HarnessItem[]> = {
    'user.skills': await collectKind(userBases, 'skills', 'user'),
    'user.commands': await collectKind(userBases, 'commands', 'user'),
    'user.agents': await collectKind(userBases, 'agents', 'user'),
    'project.skills': await collectKind(projectBases, 'skills', 'project'),
    'project.commands': await collectKind(projectBases, 'commands', 'project'),
    'project.agents': await collectKind(projectBases, 'agents', 'project'),
  };

  for (const key of Object.keys(buckets) as Bucket[]) {
    buckets[key].sort((a, b) => {
      if (a.source !== b.source) return a.source === 'self' ? -1 : 1;
      if (a.namespace !== b.namespace) return a.namespace.localeCompare(b.namespace);
      const aSub = a.isSubAsset ? 1 : 0;
      const bSub = b.isSubAsset ? 1 : 0;
      if (aSub !== bSub) return aSub - bSub;
      return a.name.localeCompare(b.name);
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    buckets,
  };
}
