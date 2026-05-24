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

export type HarnessTriggers = {
  keywords?: string[];
};

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
  author?: string;
  relates?: string[];
  triggers?: HarnessTriggers;
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
  const visited = new Set<string>();
  async function walk(current: string) {
    let realPath: string;
    try {
      realPath = await fs.realpath(current);
    } catch {
      return;
    }
    if (visited.has(realPath)) return;
    visited.add(realPath);
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      let isDir = entry.isDirectory();
      let isFile = entry.isFile();
      if (entry.isSymbolicLink()) {
        try {
          const stat = await fs.stat(full);
          isDir = stat.isDirectory();
          isFile = stat.isFile();
        } catch {
          continue;
        }
      }
      if (isDir) {
        await walk(full);
      } else if (isFile && entry.name.endsWith('.md')) {
        out.push(full);
      }
    }
  }
  await walk(dir);
  return out;
}

const SINGLE_FILE_NAMESPACE = '__single__';

function deriveNamespace(filePath: string, baseDir: string): string {
  const rel = path.relative(baseDir, filePath);
  const segments = rel.split(path.sep);
  if (segments.length <= 1) return SINGLE_FILE_NAMESPACE;
  return segments[0];
}

function firstLine(text: string): string {
  const trimmed = (text ?? '').trim();
  if (!trimmed) return '';
  const idx = trimmed.indexOf('\n');
  return idx === -1 ? trimmed : trimmed.slice(0, idx).trim();
}

function extractAuthor(fm: Record<string, unknown>): string | undefined {
  const raw = fm.author;
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  return trimmed ? trimmed : undefined;
}

function extractStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (trimmed) out.push(trimmed);
  }
  return out.length > 0 ? out : undefined;
}

function extractTriggers(fm: Record<string, unknown>): HarnessTriggers | undefined {
  const raw = fm.triggers;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const keywords = extractStringArray((raw as Record<string, unknown>).keywords);
  if (!keywords) return undefined;
  return { keywords };
}

function deriveDescriptionFromBody(body: string): string {
  if (!body) return '';
  const lines = body.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('---')) continue;
    if (line.startsWith('#')) {
      const stripped = line.replace(/^#+\s*/, '').trim();
      if (stripped) return stripped;
      continue;
    }
    return line;
  }
  return '';
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
    const isPrimaryNamed = PRIMARY_FILES.has(fileName) || hasFrontmatterName;
    const isSubAssetCandidate = !isPrimaryNamed && fileName.endsWith('.md');
    const rawName = hasFrontmatterName
      ? (fm.name as string).trim()
      : isSubAssetCandidate
        ? fileName
        : path.basename(filePath, '.md');
    const name = firstLine(rawName);
    const fmDescription = firstLine(
      typeof fm.description === 'string' ? (fm.description as string) : '',
    );
    const description = fmDescription || deriveDescriptionFromBody(parsed.content ?? '');
    const namespace = deriveNamespace(filePath, kindDir);
    const isSubAsset = !isPrimaryNamed && namespace !== SINGLE_FILE_NAMESPACE;
    const author = extractAuthor(fm);
    const relates = extractStringArray(fm.relates);
    const triggers = extractTriggers(fm);
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
      ...(author ? { author } : {}),
      ...(relates ? { relates } : {}),
      ...(triggers ? { triggers } : {}),
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
