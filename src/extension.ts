import * as vscode from 'vscode';
import * as os from 'node:os';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import { scanHarness, type HarnessData, type HarnessItem } from './scanner';

const matterOptions = {
  engines: {
    yaml: {
      parse: (input: string) => yaml.load(input) as object,
      stringify: (input: object) => yaml.dump(input),
    },
  },
};

type DetailFile = {
  name: string;
  fileName: string;
  filePath: string;
  content: string;
  frontmatter: Record<string, unknown>;
};

type DetailResponse = {
  requestId: string;
  files: DetailFile[];
};

async function readDetailFiles(filePath: string, kind?: string): Promise<DetailFile[]> {
  // commands/agents는 각 파일이 독립 항목이므로 형제를 끌어오지 않는다.
  // skills만 디렉토리 그룹(SKILL.md + 서브 자산)을 가진다.
  const isFlat = kind === 'commands' || kind === 'agents';

  const dir = path.dirname(filePath);
  let entries: string[] = [];
  if (isFlat) {
    entries = [filePath];
  } else {
    try {
      const listing = await fs.readdir(dir, { withFileTypes: true });
      entries = listing
        .filter((e) => e.isFile() && e.name.endsWith('.md'))
        .map((e) => path.join(dir, e.name));
    } catch {
      entries = [filePath];
    }
    if (entries.length === 0) entries = [filePath];
  }

  const PRIMARY = new Set(['SKILL.md', 'COMMAND.md', 'AGENT.md']);
  entries.sort((a, b) => {
    const aBase = path.basename(a);
    const bBase = path.basename(b);
    const aPri = PRIMARY.has(aBase) ? 0 : 1;
    const bPri = PRIMARY.has(bBase) ? 0 : 1;
    if (aPri !== bPri) return aPri - bPri;
    return aBase.localeCompare(bBase);
  });

  const out: DetailFile[] = [];
  for (const f of entries) {
    try {
      const raw = await fs.readFile(f, 'utf-8');
      const parsed = matter(raw, matterOptions);
      const fm = (parsed.data ?? {}) as Record<string, unknown>;
      const fmName = typeof fm.name === 'string' ? (fm.name as string).trim() : '';
      const baseName = path.basename(f, '.md');
      out.push({
        name: fmName || baseName,
        fileName: path.basename(f),
        filePath: f,
        content: raw,
        frontmatter: fm,
      });
    } catch {
      // skip unreadable
    }
  }
  return out;
}

let panel: vscode.WebviewPanel | undefined;
let outputChannel: vscode.OutputChannel | undefined;
let cachedData: HarnessData | undefined;
let refreshTimer: NodeJS.Timeout | undefined;

function log(...args: unknown[]) {
  if (!outputChannel) return;
  outputChannel.appendLine(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
}

function getProjectRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) return undefined;
  return folders[0].uri.fsPath;
}

async function loadWebviewHtml(context: vscode.ExtensionContext, webview: vscode.Webview): Promise<string> {
  const distDir = vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist');
  const indexUri = vscode.Uri.joinPath(distDir, 'index.html');
  let html: string;
  try {
    html = await fs.readFile(indexUri.fsPath, 'utf-8');
  } catch (err) {
    log('webview dist index.html을 못 읽었습니다:', String(err));
    return '<html><body><h1>webview build가 없습니다. <code>pnpm build:webview</code>를 실행하세요.</h1></body></html>';
  }

  const distBase = webview.asWebviewUri(distDir).toString();
  html = html.replace(/(href|src)="\/(.+?)"/g, (_m, attr, p) => `${attr}="${distBase}/${p}"`);
  html = html.replace(/(href|src)="\.\/(.+?)"/g, (_m, attr, p) => `${attr}="${distBase}/${p}"`);
  html = html.replace(/\s+crossorigin(?=[\s>])/g, '');

  const nonce = Math.random().toString(36).slice(2);
  const csp = `default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src ${webview.cspSource} 'nonce-${nonce}';`;
  html = html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`);
  html = html.replace(/<script /g, `<script nonce="${nonce}" `);
  const bootstrap = `<script nonce="${nonce}">window.__HARNESS_ASSET_BASE__=${JSON.stringify(distBase)};</script>`;
  html = html.replace('</head>', `${bootstrap}</head>`);
  return html;
}

async function refreshData(): Promise<HarnessData> {
  cachedData = await scanHarness(getProjectRoot());
  return cachedData;
}

async function sendData(target: vscode.WebviewPanel, forceRescan = false) {
  try {
    const data = forceRescan || !cachedData ? await refreshData() : cachedData;
    void target.webview.postMessage({ type: 'harness/data', data });
  } catch (err) {
    log('scan 실패:', String(err));
    void target.webview.postMessage({ type: 'harness/error', message: String(err) });
  }
}

function scheduleRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(async () => {
    refreshTimer = undefined;
    try {
      await refreshData();
      if (panel) void panel.webview.postMessage({ type: 'harness/data', data: cachedData });
    } catch (err) {
      log('auto refresh 실패:', String(err));
    }
  }, 300);
}

async function openFileAt(filePath: string) {
  try {
    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc, { preview: false });
  } catch (err) {
    void vscode.window.showErrorMessage(`파일을 열 수 없습니다: ${filePath}`);
    log('openFile 실패:', filePath, String(err));
  }
}

async function openOrToggle(context: vscode.ExtensionContext) {
  if (panel) {
    panel.dispose();
    return;
  }

  panel = vscode.window.createWebviewPanel(
    'claudeCodeHarnessCheatsheet',
    'Claude Code Harness Cheatsheet',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist')],
    },
  );

  panel.webview.html = await loadWebviewHtml(context, panel.webview);

  panel.webview.onDidReceiveMessage(
    async (msg: { type: string; filePath?: string; requestId?: string; kind?: string }) => {
      if (msg?.type === 'harness/ready') {
        if (panel) await sendData(panel);
      } else if (msg?.type === 'harness/refresh') {
        if (panel) await sendData(panel, true);
      } else if (msg?.type === 'harness/openFile' && msg.filePath) {
        await openFileAt(msg.filePath);
      } else if (msg?.type === 'harness/openDetail' && msg.filePath && msg.requestId) {
        try {
          const files = await readDetailFiles(msg.filePath, msg.kind);
          const response: DetailResponse = { requestId: msg.requestId, files };
          void panel?.webview.postMessage({ type: 'harness/detail', ...response });
        } catch (err) {
          log('openDetail 실패:', String(err));
          void panel?.webview.postMessage({
            type: 'harness/detailError',
            requestId: msg.requestId,
            message: String(err),
          });
        }
      }
    },
    undefined,
    context.subscriptions,
  );

  panel.onDidDispose(
    () => {
      panel = undefined;
    },
    null,
    context.subscriptions,
  );

  await sendData(panel);
}

function flattenItems(data: HarnessData): HarnessItem[] {
  return Object.values(data.buckets).flat();
}

async function runQuickPick() {
  const data = cachedData ?? (await refreshData());
  const all = flattenItems(data);
  if (all.length === 0) {
    void vscode.window.showInformationMessage('스킬/커맨드/에이전트를 찾지 못했습니다.');
    return;
  }
  const items: (vscode.QuickPickItem & { item: HarnessItem })[] = all.map((it) => {
    const scopeLabel = it.scope === 'user' ? '유저' : '프로젝트';
    const kindLabel = it.kind === 'skills' ? '스킬' : it.kind === 'commands' ? '커맨드' : '에이전트';
    const sourceLabel = it.source === 'plugin' ? `[${it.pluginName ?? 'plugin'}]` : '[self]';
    return {
      label: it.name,
      description: `${sourceLabel} ${scopeLabel} · ${kindLabel} · ${it.namespace}`,
      detail: it.description,
      item: it,
    };
  });
  const picked = await vscode.window.showQuickPick(items, {
    placeHolder: '스킬·커맨드·에이전트 검색 (이름 또는 설명)',
    matchOnDescription: true,
    matchOnDetail: true,
  });
  if (picked) {
    await openFileAt(picked.item.filePath);
  }
}

async function runLint() {
  const data = cachedData ?? (await refreshData());
  const all = flattenItems(data);
  const channel = outputChannel ?? vscode.window.createOutputChannel('Claude Code Harness Cheatsheet');
  channel.clear();
  channel.show(true);
  channel.appendLine(`[lint] 스캔 결과: ${all.length}개 항목`);
  channel.appendLine('');

  const bySlug = new Map<string, HarnessItem>();
  for (const it of all) {
    if (!bySlug.has(it.name)) bySlug.set(it.name, it);
  }

  // 1. relates 대상 slug 존재 여부
  const missingTargets: string[] = [];
  for (const it of all) {
    if (!it.relates) continue;
    for (const target of it.relates) {
      if (!bySlug.has(target)) {
        missingTargets.push(`  ${it.name} -> ${target}  (대상 없음)`);
      }
    }
  }

  // 2. 양방향 무결성
  const asymmetric: string[] = [];
  for (const it of all) {
    if (!it.relates) continue;
    for (const target of it.relates) {
      const t = bySlug.get(target);
      if (!t) continue;
      if (!t.relates || !t.relates.includes(it.name)) {
        asymmetric.push(`  ${it.name} -> ${target}  (역방향 없음)`);
      }
    }
  }

  // 3. author 누락
  const missingAuthor: string[] = [];
  for (const it of all) {
    if (!it.author || !it.author.trim()) {
      if (!it.isSubAsset) {
        missingAuthor.push(`  ${it.name}  (${it.scope}/${it.kind}, ${it.filePath})`);
      }
    }
  }

  channel.appendLine(`[1] relates 대상이 존재하지 않는 항목 (${missingTargets.length}건)`);
  if (missingTargets.length === 0) channel.appendLine('  ✓ 문제 없음');
  else missingTargets.forEach((l) => channel.appendLine(l));
  channel.appendLine('');

  channel.appendLine(`[2] 양방향 무결성 경고 (${asymmetric.length}건) — A→B이지만 B→A가 없는 경우`);
  if (asymmetric.length === 0) channel.appendLine('  ✓ 문제 없음');
  else {
    channel.appendLine('  의도적 비대칭(entry point, cross-link)일 수 있습니다.');
    asymmetric.forEach((l) => channel.appendLine(l));
  }
  channel.appendLine('');

  channel.appendLine(`[3] author 필드가 없는 skill/command/agent (${missingAuthor.length}건)`);
  if (missingAuthor.length === 0) channel.appendLine('  ✓ 문제 없음');
  else missingAuthor.forEach((l) => channel.appendLine(l));
  channel.appendLine('');

  channel.appendLine(`[요약] missing-target=${missingTargets.length} asymmetric=${asymmetric.length} missing-author=${missingAuthor.length}`);
}

function registerWatchers(context: vscode.ExtensionContext) {
  const home = os.homedir();
  const userBase = path.join(home, '.claude');
  const pluginCache = path.join(userBase, 'plugins', 'cache');

  const patterns = [
    new vscode.RelativePattern(userBase, '{skills,commands,agents}/**/*.md'),
    new vscode.RelativePattern(pluginCache, '**/{skills,commands,agents}/**/*.md'),
  ];

  for (const pattern of patterns) {
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange(scheduleRefresh);
    watcher.onDidCreate(scheduleRefresh);
    watcher.onDidDelete(scheduleRefresh);
    context.subscriptions.push(watcher);
  }

  const projectRoot = getProjectRoot();
  if (projectRoot) {
    const projectWatcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(projectRoot, '.claude/{skills,commands,agents}/**/*.md'),
    );
    projectWatcher.onDidChange(scheduleRefresh);
    projectWatcher.onDidCreate(scheduleRefresh);
    projectWatcher.onDidDelete(scheduleRefresh);
    context.subscriptions.push(projectWatcher);
  }
}

export function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Claude Code Harness Cheatsheet');
  context.subscriptions.push(outputChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeCodeHarnessCheatsheet.toggle', () => openOrToggle(context)),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeCodeHarnessCheatsheet.refresh', async () => {
      if (panel) await sendData(panel, true);
      else await refreshData();
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeCodeHarnessCheatsheet.search', () => runQuickPick()),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeCodeHarnessCheatsheet.lint', () => runLint()),
  );

  registerWatchers(context);
}

export function deactivate() {
  panel?.dispose();
  panel = undefined;
  if (refreshTimer) clearTimeout(refreshTimer);
}
