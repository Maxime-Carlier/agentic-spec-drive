#!/usr/bin/env node
// Spec workflow helper. See specs/WORKFLOW.md. Node built-ins only.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SPECS = join(ROOT, 'specs');
const STATUSES = ['doing', 'paused', 'todo', 'done'];
const HINT = 'Run /work to resume or /work <id> to start a spec; see specs/WORKFLOW.md.';

// ---------- helpers ----------

const read = (p) => readFileSync(p, 'utf8');
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rel = (p) => p.slice(ROOT.length + 1);

function git(...args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return '';
  }
}

function list(dir) {
  try { return readdirSync(dir, { withFileTypes: true }); } catch { return []; }
}

function parseValue(raw) {
  let v = raw.trim();
  if (v.startsWith('[')) {
    return v.replace(/\s+#.*$/, '').replace(/^\[|\]$/g, '').split(',').map((x) => unquote(x.trim())).filter(Boolean);
  }
  if (/^["']/.test(v)) return unquote(v.replace(/(["'])\s+#.*$/, '$1'));
  return v.replace(/\s+#.*$/, '');
}

function unquote(v) {
  return v.replace(/^(["'])(.*)\1$/, '$2');
}

function parseSpec(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (kv) fm[kv[1]] = parseValue(kv[2]);
    }
  }
  return fm;
}

function progress(text) {
  const m = text.match(/^## Progress\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  const get = (k) => (m && m[1].match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1].trim()) || '';
  return { stage: get('Stage'), task: get('Task') };
}

const slugTitle = (slug) => {
  const s = slug.replace(/-/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
};

// ---------- loading ----------

function branches() {
  const out = git('branch', '--list', 'spec/*', '--format=%(refname:short)');
  return out ? out.split('\n').map((b) => b.trim()).filter(Boolean) : [];
}

function makeSpec(status, file, extra = {}) {
  const text = read(file);
  const fm = parseSpec(text);
  return { status, file, text, fm, id: fm.id || '', title: fm.title || '', description: fm.description || '', tags: Array.isArray(fm.tags) ? fm.tags : [], ...extra };
}

function load() {
  const all = [];
  const current = git('rev-parse', '--abbrev-ref', 'HEAD');
  const byId = new Map();
  for (const b of branches()) {
    const m = b.match(/^spec\/(\d{3})-(.+)$/);
    if (m) byId.set(m[1], { branch: b, slug: m[2] });
  }
  const mdFiles = (dir) => list(dir).filter((e) => e.isFile() && /^\d{3}-.*\.md$/.test(e.name)).map((e) => e.name);
  const idOf = (name) => name.slice(0, 3);

  for (const name of mdFiles(join(SPECS, 'todo'))) {
    const id = idOf(name);
    const br = byId.get(id);
    if (br && br.branch === current) continue; // being worked on: doing/ is authoritative
    const s = makeSpec(br ? 'paused' : 'todo', join(SPECS, 'todo', name), { key: id });
    if (br) s.branch = br.branch;
    all.push(s);
  }
  for (const e of list(join(SPECS, 'doing'))) {
    const file = join(SPECS, 'doing', e.name, 'spec.md');
    if (!e.isDirectory() || !existsSync(file)) continue;
    const id = idOf(e.name);
    const br = byId.get(id);
    const s = makeSpec(br && br.branch === current ? 'doing' : 'paused', file, { key: id, ...progress(read(file)) });
    if (br) s.branch = br.branch;
    all.push(s);
  }
  for (const name of mdFiles(join(SPECS, 'done'))) {
    all.push(makeSpec('done', join(SPECS, 'done', name), { key: idOf(name) }));
  }
  // Branches with no visible file: paused (or doing if checked out), title from slug.
  for (const [id, br] of byId) {
    if (all.some((s) => s.key === id && s.status !== 'done')) continue;
    const status = br.branch === current ? 'doing' : 'paused';
    all.push({ status, key: id, id, title: slugTitle(br.slug), description: '', tags: [], text: '', fm: {}, branch: br.branch, stage: '', task: '', file: '' });
  }
  for (const s of all) s.id ||= s.key;
  return all;
}

const order = (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) || a.id.localeCompare(b.id);

// ---------- commands ----------

function fmtLine(s, w) {
  const tags = s.tags.length ? `  [${s.tags.join(', ')}]` : '';
  return `${s.status.padEnd(w)}  ${s.id}  ${s.title}${tags}`;
}

function fail(msg) {
  console.error(msg);
  process.exit(2);
}

function parseFind(args) {
  const o = { status: 'all', tags: [], where: 'meta', words: [] };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--status' || a === '--tag' || a === '--in') {
      const v = args[++i];
      if (v === undefined) fail(`missing value for ${a}`);
      if (a === '--tag') o.tags.push(v);
      else if (a === '--status') {
        if (!['all', ...STATUSES].includes(v)) fail(`invalid status: ${v} (todo|doing|paused|done|all)`);
        o.status = v;
      } else {
        if (!['meta', 'all'].includes(v)) fail(`invalid --in: ${v} (meta|all)`);
        o.where = v;
      }
    } else if (a.startsWith('--')) fail(`unknown option: ${a}`);
    else o.words.push(a);
  }
  return o;
}

function cmdFind(args) {
  const o = parseFind(args);
  const q = norm(o.words.join(' '));
  const rows = [];
  for (const s of load().sort(order)) {
    if (o.status !== 'all' && s.status !== o.status) continue;
    if (!o.tags.every((t) => s.tags.includes(t))) continue;
    let hits = [];
    if (q) {
      if (o.where === 'meta') {
        if (!norm(`${s.title}\n${s.description}`).includes(q)) continue;
      } else {
        const lines = s.text.split('\n');
        hits = lines.map((t, i) => [i + 1, t]).filter(([, t]) => norm(t).includes(q));
        if (!hits.length && !norm(s.title).includes(q)) continue;
      }
    }
    rows.push({ s, hits });
  }
  if (!rows.length) return console.log('no match');
  const w = Math.max(...rows.map((r) => r.s.status.length));
  for (const { s, hits } of rows) {
    console.log(fmtLine(s, w));
    for (const [n, t] of hits.slice(0, 3)) console.log(`    L${n}: ${t.trim()}`);
  }
}

function section(title, specs, fmt) {
  console.log(`${title}`);
  if (!specs.length) console.log('  (none)');
  for (const s of specs) console.log(`  ${fmt(s)}`);
  console.log('');
}

function stageText(s) {
  return [s.stage, s.task && `task ${s.task}`].filter(Boolean).join(', ');
}

function cmdBoard() {
  const all = load();
  const of = (st) => all.filter((s) => s.status === st).sort(order);
  const tags = (s) => (s.tags.length ? `  [${s.tags.join(', ')}]` : '');
  section('In progress', of('doing'), (s) => `${s.id}  ${s.title}${stageText(s) ? `  (${stageText(s)})` : ''}`);
  section('Paused', of('paused'), (s) => `${s.id}  ${s.title}${s.branch ? `  (${s.branch})` : ''}`);
  section('Todo', of('todo'), (s) => `${s.id}  ${s.title}${tags(s)}`);
  const done = of('done').sort((a, b) => (b.fm.closed || '').localeCompare(a.fm.closed || '') || b.id.localeCompare(a.id)).slice(0, 5);
  section('Done (last 5, by closed date)', done, (s) => `${s.id}  ${s.title}  ${s.fm.closed || ''}`.trimEnd());
}

function currentLine(all = load()) {
  const s = all.find((x) => x.status === 'doing');
  if (!s) return 'no spec in progress';
  const st = [s.stage, s.task].filter(Boolean).join(' ');
  return `spec-${s.id} ${s.title}${st ? ` · ${st}` : ''}`;
}

function cmdHook() {
  const all = load();
  const doing = all.find((s) => s.status === 'doing');
  const paused = all.filter((s) => s.status === 'paused').sort(order).map((s) => `spec-${s.id}`);
  const todo = all.filter((s) => s.status === 'todo').length;
  if (doing) {
    const st = stageText(doing);
    console.log(`Spec workflow: in progress spec-${doing.id} "${doing.title}"${st ? ` (${st})` : ''} on branch ${doing.branch || '?'}.`);
  } else {
    console.log(`Spec workflow: nothing in progress. Todo: ${todo}.`);
  }
  if (doing) console.log(`${paused.length ? `Paused: ${paused.join(', ')}. ` : ''}Todo: ${todo}.`);
  else if (paused.length) console.log(`Paused: ${paused.join(', ')}.`);
  console.log(HINT);
}

function cmdStatusline() {
  // Never block: only drain stdin when it is piped.
  if (!process.stdin.isTTY) {
    try { readFileSync(0); } catch { /* empty or closed stdin */ }
  }
  console.log(currentLine());
}

function nextId() {
  const ids = [];
  for (const d of ['todo', 'done', 'doing']) {
    for (const e of list(join(SPECS, d))) {
      const m = e.name.match(/^(\d{3})-/);
      if (m) ids.push(Number(m[1]));
    }
  }
  for (const b of branches()) {
    const m = b.match(/^spec\/(\d{3})-/);
    if (m) ids.push(Number(m[1]));
  }
  return String(Math.max(0, ...ids) + 1).padStart(3, '0');
}

function allowedTags() {
  const f = join(SPECS, 'TAGS.md');
  if (!existsSync(f)) return null;
  return new Set([...read(f).matchAll(/`([^`\s]+)`/g)].map((m) => m[1]));
}

function cmdLint() {
  const errors = [];
  const tags = allowedTags();
  if (!tags) errors.push('specs/TAGS.md: missing');
  const specs = [];
  for (const [dir, status] of [['todo', 'todo'], ['done', 'done']]) {
    for (const e of list(join(SPECS, dir))) {
      if (e.isFile() && e.name.endsWith('.md')) specs.push({ status, name: e.name, file: join(SPECS, dir, e.name) });
    }
  }
  for (const e of list(join(SPECS, 'doing'))) {
    const file = join(SPECS, 'doing', e.name, 'spec.md');
    if (e.isDirectory() && existsSync(file)) specs.push({ status: 'doing', name: e.name, file });
  }
  const seen = new Map();
  for (const sp of specs) {
    const err = (m) => errors.push(`${rel(sp.file)}: ${m}`);
    const fm = parseSpec(read(sp.file));
    for (const k of ['id', 'title', 'description', 'tags', 'created']) {
      if (fm[k] === undefined || fm[k] === '' || (Array.isArray(fm[k]) && !fm[k].length && k !== 'tags')) err(`missing field "${k}"`);
    }
    if (fm.id !== undefined) {
      if (!/^\d{3}$/.test(fm.id)) err(`id "${fm.id}" is not three digits`);
      else if (!sp.name.startsWith(`${fm.id}-`)) err(`id "${fm.id}" does not match name "${sp.name}"`);
      if (seen.has(fm.id)) err(`duplicate id ${fm.id} (also ${rel(seen.get(fm.id))})`);
      else seen.set(fm.id, sp.file);
    }
    for (const k of ['created', 'refined', 'closed']) {
      if (fm[k] !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(fm[k])) err(`${k} "${fm[k]}" is not YYYY-MM-DD`);
    }
    if (sp.status === 'done' && !fm.closed) err('done spec has no "closed" date');
    if (sp.status !== 'done' && fm.closed !== undefined) err(`"closed" set on a ${sp.status} spec`);
    if (tags && Array.isArray(fm.tags)) {
      for (const t of fm.tags) if (!tags.has(t)) err(`unknown tag "${t}"`);
    }
  }
  if (errors.length) {
    console.log(errors.join('\n'));
    process.exit(1);
  }
  console.log(`ok (${specs.length} specs)`);
}

function usage() {
  console.log(`Usage: node .claude/scripts/specs.mjs <command>

  find [--status todo|doing|paused|done|all] [--tag t]... [--in meta|all] [query]
  board        in progress, paused, todo, last five done
  current      the spec in progress, one line
  hook         session-start context
  statusline   same as current (ignores stdin)
  next-id      next free spec id
  lint         check frontmatter, tags, ids (exit 1 on errors)
  help         this text`);
}

const [cmd, ...rest] = process.argv.slice(2);
const commands = {
  find: () => cmdFind(rest),
  board: cmdBoard,
  current: () => console.log(currentLine()),
  hook: cmdHook,
  statusline: cmdStatusline,
  'next-id': () => console.log(nextId()),
  lint: cmdLint,
  help: usage,
};
if (!cmd) usage();
else if (commands[cmd]) commands[cmd]();
else {
  console.error(`unknown command: ${cmd}`);
  usage();
  process.exit(2);
}
