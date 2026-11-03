#!/usr/bin/env node

/**
 * Renders docs/*.md into static pages under docs/html/ (index, ORMO_PLAN, FEATURE_SPEC, GUIDE).
 * The markdown files are the source; edit those and run `node scripts/build-docs.mjs`.
 * Only the markdown used in these docs is supported: headings, paragraphs, nested lists, tables,
 * fenced code, blockquotes, rules, **bold**, `code` and [links](url).
 */

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const outDir = path.join(docsDir, 'html');

const PAGES = [
  {
    file: 'ORMO_PLAN.html',
    title: 'ORMO Manager 기획서',
    summary: '기획 초안의 워크플로우에 현재 구현 상태를 붙이고, 남은 기능을 정리한 문서입니다.',
    sources: [{ md: 'ormo-plan.md' }, { md: 'remaining-features.md', demote: 1 }],
  },
  {
    file: 'FEATURE_SPEC.html',
    title: '기능 명세 (BE 대조용)',
    summary: '현재 앱 코드에서 추출한 기능 명세입니다. BE 코드베이스와 대조할 때 사용합니다.',
    sources: [{ md: 'admin-app-feature-spec.md' }],
  },
  {
    file: 'GUIDE.html',
    title: '개발 가이드',
    summary: '프로젝트 구조, 상태 관리, 화면 규칙, BE 연동 시 걷어낼 mock을 정리했습니다.',
    sources: [{ md: 'dev-guide.md' }],
  },
];

const BADGES = {
  미구현: 'todo',
  불일치: 'diff',
  논의: 'talk',
  확인: 'talk',
  BE: 'be',
  앱: 'app',
  mock: 'mock',
  가정: 'assume',
};

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function inline(text) {
  const codes = [];
  let out = escapeHtml(text).replace(/`([^`]+)`/g, (_, code) => {
    codes.push(`<code>${code}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = out
    .replace(/\*\*\[([^\]]+)\]\*\*/g, (whole, label) =>
      BADGES[label] ? `<span class="badge badge-${BADGES[label]}">${label}</span>` : whole
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  return out.replace(/\u0000(\d+)\u0000/g, (_, index) => codes[Number(index)]);
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim());
}

function render(markdown, demote, headings, usedIds) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let i = 0;

  function slug(text) {
    const base = text.replace(/[`*]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'section';
    let id = base;
    for (let n = 2; usedIds.has(id); n += 1) id = `${base}-${n}`;
    usedIds.add(id);
    return id;
  }

  function list(indent) {
    const ordered = /^\s*\d+\./.test(lines[i]);
    const tag = ordered ? 'ol' : 'ul';
    const out = [`<${tag}>`];
    while (i < lines.length) {
      const match = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
      if (!match) break;
      const depth = match[1].length;
      if (depth < indent) break;
      if (depth > indent) {
        // A deeper item continues the previous <li>.
        out[out.length - 1] = out[out.length - 1].replace(/<\/li>$/, '') + list(depth) + '</li>';
        continue;
      }
      out.push(`<li>${inline(match[3])}</li>`);
      i += 1;
    }
    out.push(`</${tag}>`);
    return out.join('');
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') {
      i += 1;
    } else if (line.startsWith('```')) {
      const code = [];
      i += 1;
      while (i < lines.length && !lines[i].startsWith('```')) code.push(lines[i++]);
      i += 1;
      html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
    } else if (/^#{1,4}\s/.test(line)) {
      const level = Math.min(line.match(/^#+/)[0].length + demote, 4);
      const text = line.replace(/^#+\s+/, '');
      const id = slug(text);
      if (level === 2 || level === 3) headings.push({ level, id, text: text.replace(/[`*]/g, '') });
      html.push(`<h${level} id="${id}">${inline(text)}</h${level}>`);
      i += 1;
    } else if (/^-{3,}$/.test(line.trim())) {
      html.push('<hr>');
      i += 1;
    } else if (line.trim().startsWith('|')) {
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(splitRow(lines[i++]));
      html.push(
        '<div class="table-wrap"><table><thead><tr>' +
          header.map((cell) => `<th>${inline(cell)}</th>`).join('') +
          '</tr></thead><tbody>' +
          rows.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell)}</td>`).join('')}</tr>`).join('') +
          '</tbody></table></div>'
      );
    } else if (/^\s*([-*]|\d+\.)\s/.test(line)) {
      html.push(list(line.match(/^\s*/)[0].length));
    } else if (line.startsWith('>')) {
      const quote = [];
      while (i < lines.length && lines[i].startsWith('>')) quote.push(lines[i++].replace(/^>\s?/, ''));
      html.push(`<blockquote>${inline(quote.join(' '))}</blockquote>`);
    } else {
      const paragraph = [];
      while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,4}\s|```|\||\s*([-*]|\d+\.)\s|-{3,}$)/.test(lines[i])) {
        paragraph.push(lines[i++]);
      }
      html.push(`<p>${inline(paragraph.join(' '))}</p>`);
    }
  }
  return html.join('\n');
}

const STYLE = `
:root{--bg:#f7f8fa;--card:#fff;--text:#1b1f24;--muted:#5d6672;--border:#e3e6eb;--accent:#008aff;--accent-bg:#e6f3ff;--code-bg:#eef1f5;--pre-bg:#14181d;--pre-text:#e8ecf1}
@media (prefers-color-scheme:dark){:root{--bg:#101317;--card:#181c22;--text:#e8ecf1;--muted:#98a2b0;--border:#2a303a;--accent:#4aa8ff;--accent-bg:#14273b;--code-bg:#232a33;--pre-bg:#0b0e11}}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","Apple SD Gothic Neo","Malgun Gothic",sans-serif}
a{color:var(--accent)}
.topbar{position:sticky;top:0;z-index:5;display:flex;gap:4px;align-items:center;flex-wrap:wrap;padding:10px 16px;background:var(--card);border-bottom:1px solid var(--border)}
.topbar .brand{font-weight:800;margin-right:12px;color:var(--text);text-decoration:none}
.topbar a.nav{padding:6px 12px;border-radius:8px;color:var(--muted);text-decoration:none;font-size:14px;font-weight:600}
.topbar a.nav:hover{background:var(--accent-bg);color:var(--accent)}
.topbar a.nav.active{background:var(--accent-bg);color:var(--accent)}
.layout{display:flex;gap:32px;max-width:1200px;margin:0 auto;padding:24px 16px 80px}
.toc{display:none;flex:0 0 240px;position:sticky;top:72px;align-self:flex-start;max-height:calc(100vh - 96px);overflow:auto;font-size:14px}
.toc a{display:block;padding:3px 0;color:var(--muted);text-decoration:none}
.toc a:hover{color:var(--accent)}
.toc a.l3{padding-left:14px;font-size:13px}
.toc .label{font-size:12px;font-weight:700;color:var(--muted);margin-bottom:6px;letter-spacing:.04em}
@media (min-width:1000px){.toc{display:block}}
main{flex:1;min-width:0;background:var(--card);border:1px solid var(--border);border-radius:14px;padding:8px 32px 32px}
@media (max-width:600px){main{padding:4px 18px 24px;border-radius:10px}}
h1{font-size:28px;line-height:1.3;margin:28px 0 12px}
h2{font-size:22px;margin:40px 0 12px;padding-top:8px;border-top:1px solid var(--border)}
h1+h2,h1+p+h2{border-top:0}
h3{font-size:18px;margin:28px 0 8px}
h4{font-size:16px;margin:20px 0 6px}
h2,h3,h4{scroll-margin-top:72px;line-height:1.4}
p,li{overflow-wrap:anywhere}
ul,ol{padding-left:22px;margin:8px 0}
li{margin:4px 0}
li>ul,li>ol{margin:4px 0}
hr{border:0;border-top:1px solid var(--border);margin:32px 0}
code{background:var(--code-bg);padding:1px 6px;border-radius:5px;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
pre{background:var(--pre-bg);color:var(--pre-text);padding:14px 16px;border-radius:10px;overflow:auto}
pre code{background:none;padding:0;color:inherit}
.table-wrap{overflow-x:auto;margin:12px 0}
table{border-collapse:collapse;width:100%;font-size:14px}
th,td{border:1px solid var(--border);padding:8px 12px;text-align:left;vertical-align:top}
th{background:var(--code-bg);white-space:nowrap}
blockquote{margin:12px 0;padding:8px 16px;border-left:4px solid var(--accent);background:var(--accent-bg);border-radius:0 8px 8px 0}
.badge{display:inline-block;padding:0 8px;border-radius:999px;font-size:12px;font-weight:700;line-height:20px;vertical-align:1px;border:1px solid transparent}
.badge-todo{background:#fde8e8;color:#b42318}
.badge-diff{background:#fff1d6;color:#9a5b00}
.badge-talk{background:#e8eefc;color:#2848a8}
.badge-be{background:#e6f6ee;color:#146c43}
.badge-app{background:#e6f3ff;color:#0a5aa8}
.badge-mock{background:#eee6fa;color:#5a34a0}
.badge-assume{background:#fff1d6;color:#9a5b00}
@media (prefers-color-scheme:dark){.badge-todo{background:#3a1717;color:#ff9b93}.badge-diff,.badge-assume{background:#3a2b10;color:#ffc766}.badge-talk{background:#18233f;color:#9db8ff}.badge-be{background:#12301f;color:#7fd8a6}.badge-app{background:#14273b;color:#7cc1ff}.badge-mock{background:#271b3d;color:#c4a6ff}}
.home{max-width:960px;margin:0 auto;padding:48px 16px 80px}
.home h1{margin-top:0}
.home p.lead{color:var(--muted)}
.cards{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));margin-top:28px}
.card{display:block;padding:20px;border:1px solid var(--border);border-radius:14px;background:var(--card);color:var(--text);text-decoration:none}
.card:hover{border-color:var(--accent)}
.card h2{font-size:18px;margin:0 0 6px;border:0;padding:0}
.card p{margin:0;color:var(--muted);font-size:14px}
.card .file{display:block;margin-top:12px;font-size:12px;color:var(--accent);font-weight:700}
`;

function nav(activeFile) {
  const links = [
    { file: 'index.html', label: '목차' },
    ...PAGES.map((page) => ({ file: page.file, label: page.file.replace('.html', '') })),
  ];
  return (
    '<header class="topbar"><a class="brand" href="index.html">ORMO 관리자 앱 문서</a>' +
    links.map((link) => `<a class="nav${link.file === activeFile ? ' active' : ''}" href="${link.file}">${link.label}</a>`).join('') +
    '</header>'
  );
}

function shell(title, activeFile, body) {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLE}</style>
</head>
<body>
${nav(activeFile)}
${body}
</body>
</html>
`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const page of PAGES) {
  const headings = [];
  const usedIds = new Set();
  const content = page.sources
    .map((source) => {
      const markdown = fs.readFileSync(path.join(docsDir, source.md), 'utf8');
      return render(markdown, source.demote ?? 0, headings, usedIds);
    })
    .join('\n<hr>\n');
  const toc =
    '<nav class="toc"><div class="label">목차</div>' +
    headings.map((heading) => `<a class="l${heading.level}" href="#${heading.id}">${escapeHtml(heading.text)}</a>`).join('') +
    '</nav>';
  fs.writeFileSync(
    path.join(outDir, page.file),
    shell(page.title, page.file, `<div class="layout">${toc}<main>${content}</main></div>`)
  );
}

const cards = PAGES.map(
  (page) =>
    `<a class="card" href="${page.file}"><h2>${escapeHtml(page.title)}</h2><p>${escapeHtml(page.summary)}</p><span class="file">${page.file}</span></a>`
).join('');
fs.writeFileSync(
  path.join(outDir, 'index.html'),
  shell(
    'ORMO 관리자 앱 문서',
    'index.html',
    `<div class="home"><h1>ORMO 관리자 앱 문서</h1><p class="lead">카페 운영자용 태블릿 앱(ORMO Manager)의 기획, 기능 명세, 개발 가이드입니다. 원본은 <code>docs/*.md</code>이고 <code>node scripts/build-docs.mjs</code>로 이 페이지를 다시 만듭니다.</p><div class="cards">${cards}</div></div>`
  )
);

console.log(`Wrote ${PAGES.length + 1} pages to ${path.relative(root, outDir)}`);
