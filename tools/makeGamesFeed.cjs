// ============================================================
//  DANH SÁCH "GAME KHÁC" CHO CÁC APP —  node tools/makeGamesFeed.cjs   (chạy từ gốc repo tienld235.github.io)
//
//  Nguồn DUY NHẤT là mảng PRODUCTS trong index.html: app nào `live: true` (đã công khai trên Play) và là game — hoặc app có
//  `promo: true` — thì vào danh sách. Mô tả 5 thứ tiếng lấy ở data/taglines.json (chép đúng mô tả ngắn đã nộp Play; thiếu
//  thì dùng `tagline` tiếng Anh của trang). Icon là assets/<slug>-icon.webp có sẵn (tools/makeSiteAssets.cjs).
//
//  Ra games.json ở gốc trang → https://tienld235.github.io/games.json. Mọi game có màn "Game khác" (Yummy Loop đầu tiên,
//  25/11/2026) tự tải file này mỗi lần mở app — ra game mới chỉ cần bật `live: true`, chạy lệnh này, commit + push trang.
//  KHÔNG phải dựng lại AAB của game nào. Quy trình: KnowHow roles/developer/03-COMMON-FEATURES.md "Game khác".
//
//  v (số phiên bản danh sách) chỉ đổi khi nội dung đổi → game biết bản đã lưu có cũ hơn bản đóng gói kèm app không.
// ============================================================
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const start = html.indexOf('const PRODUCTS = [');
if (start < 0) throw new Error('Không thấy "const PRODUCTS = [" trong index.html');
const open = html.indexOf('[', start);
let depth = 0;
let end = open;
for (; end < html.length; end += 1) {
  if (html[end] === '[') depth += 1;
  if (html[end] === ']') depth -= 1;
  if (depth === 0) break;
}
// eslint-disable-next-line no-new-func
const PRODUCTS = new Function(`return ${html.slice(open, end + 1)}`)();

const taglinesPath = path.join(ROOT, 'data', 'taglines.json');
const TAGLINES = fs.existsSync(taglinesPath) ? JSON.parse(fs.readFileSync(taglinesPath, 'utf8')) : {};
const LANGS = ['en', 'vi', 'es', 'pt', 'id'];
const len = (s) => [...s].length;

const games = [];
const problems = [];
for (const p of PRODUCTS) {
  if (p.live !== true || !(p.kind === 'game' || p.promo === true)) continue;
  const iconRel = `assets/${p.slug}-icon.webp`;
  const iconFile = path.join(ROOT, iconRel);
  if (!fs.existsSync(iconFile)) {
    problems.push(`${p.slug}: thiếu ${iconRel} (chạy tools/makeSiteAssets.cjs)`);
    continue;
  }
  const iconV = crypto.createHash('sha1').update(fs.readFileSync(iconFile)).digest('hex').slice(0, 8);
  const src = TAGLINES[p.slug] || {};
  const tagline = {};
  for (const l of LANGS) {
    const s = String(src[l] || (l === 'en' ? p.tagline || '' : '')).trim();
    if (s) tagline[l] = s;
    if (len(s) > 90) problems.push(`${p.slug}.${l}: ${len(s)} ký tự — quá dài cho thẻ trong game`);
  }
  if (!tagline.en) problems.push(`${p.slug}: không có mô tả tiếng Anh`);
  games.push({ slug: p.slug, pkg: p.pkg, kind: p.kind, title: p.title, genre: p.genre, tagline, icon: iconRel, iconV });
}
if (problems.length) {
  console.error('LỖI:\n  ' + problems.join('\n  '));
  process.exit(1);
}

const out = path.join(ROOT, 'games.json');
const hash = crypto.createHash('sha1').update(JSON.stringify(games)).digest('hex').slice(0, 12);
let v = 0;
if (fs.existsSync(out)) {
  const old = JSON.parse(fs.readFileSync(out, 'utf8'));
  if (old.hash === hash) v = old.v;
}
if (!v) {
  const d = new Date();
  const p2 = (n) => String(n).padStart(2, '0');
  v = Number(`${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}`);
}
fs.writeFileSync(out, JSON.stringify({ v, hash, games }, null, 1) + '\n');
console.log(`games.json: ${games.length} app, v ${v}${v && fs.existsSync(out) ? '' : ''}`);
for (const g of games) console.log(`  ${g.slug.padEnd(16)} ${g.pkg.padEnd(26)} ${Object.keys(g.tagline).join(' ')}`);
