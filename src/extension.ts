import * as vscode from 'vscode';
import * as os from 'node:os';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';
import { scanHarness, type HarnessData, type HarnessItem } from './scanner';

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
    'claudeHarnessCheatsheet',
    'Claude Harness Cheatsheet',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'webview', 'dist')],
    },
  );

  panel.webview.html = await loadWebviewHtml(context, panel.webview);

  panel.webview.onDidReceiveMessage(
    async (msg: { type: string; filePath?: string }) => {
      if (msg?.type === 'harness/ready') {
        if (panel) await sendData(panel);
      } else if (msg?.type === 'harness/refresh') {
        if (panel) await sendData(panel, true);
      } else if (msg?.type === 'harness/openFile' && msg.filePath) {
        await openFileAt(msg.filePath);
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
  outputChannel = vscode.window.createOutputChannel('Claude Harness Cheatsheet');
  context.subscriptions.push(outputChannel);

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeHarnessCheatsheet.toggle', () => openOrToggle(context)),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeHarnessCheatsheet.refresh', async () => {
      if (panel) await sendData(panel, true);
      else await refreshData();
    }),
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('claudeHarnessCheatsheet.search', () => runQuickPick()),
  );

  registerWatchers(context);
}

export function deactivate() {
  panel?.dispose();
  panel = undefined;
  if (refreshTimer) clearTimeout(refreshTimer);
}
