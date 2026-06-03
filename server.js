import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sites.json');

const seed = {
  sites: [
    {
      id: crypto.randomUUID(),
      slug: 'pure-power-washing',
      name: 'Pure Power Washing',
      status: 'published',
      industry: 'Exterior cleaning',
      location: 'Cincinnati, OH',
      currentUrl: 'https://example.com',
      headline: 'Make the outside of your home look brand new in one afternoon.',
      subheadline: 'House washing, driveway cleaning, roof soft-wash, and commercial exterior cleaning with fast quotes and no-pressure scheduling.',
      offer: 'Free same-day estimate + $75 off your first full-property wash.',
      phone: '(513) 555-0198',
      email: 'hello@purepowerwashing.test',
      socials: '@purepowerwash',
      notes: 'Imaginary seed client for the first demo. Built to test path-based preview pages.',
      palette: 'blue',
      sections: [
        { title: 'Why homeowners call us', body: 'Transparent pricing, careful soft-wash methods, insured crews, and before/after photos on every job.' },
        { title: 'Services', body: 'House wash, concrete cleaning, fence/deck wash, gutter brightening, storefront cleaning, and seasonal maintenance plans.' },
        { title: 'Proof', body: '4.9-star local crew, 1,200+ properties cleaned, and a 24-hour rain-check touch-up promise.' }
      ],
      links: [
        { label: 'Current website', url: 'https://example.com' },
        { label: 'Instagram', url: 'https://instagram.com/' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
}
function readDb() { ensureDb(); return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
function writeDb(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function slugify(s) { return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 80) || 'untitled'; }
function esc(s='') { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function json(res, code, data) { send(res, code, JSON.stringify(data), 'application/json; charset=utf-8'); }
function send(res, code, body, type='text/html; charset=utf-8', extra={}) { res.writeHead(code, { 'content-type': type, 'cache-control': 'no-store', ...extra }); res.end(body); }
async function body(req) { let b=''; for await (const c of req) b += c; return b ? JSON.parse(b) : {}; }

const staticSites = {
  'pure-pressure-power-washing': path.join(process.cwd(), 'client-sites', 'pure-pressure-power-washing')
};
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.svg':'image/svg+xml', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.ico':'image/x-icon' };
function safeJoin(root, rel) {
  const resolved = path.resolve(root, rel || 'index.html');
  const rootResolved = path.resolve(root);
  return resolved === rootResolved || resolved.startsWith(rootResolved + path.sep) ? resolved : null;
}
function serveStaticSite(req, res, url, slug, root) {
  if (url.pathname === `/${slug}`) return send(res, 308, '', 'text/plain', { location: `/${slug}/` });
  const rel = decodeURIComponent(url.pathname.slice(slug.length + 2)) || 'index.html';
  const file = safeJoin(root, rel.endsWith('/') ? rel + 'index.html' : rel);
  if (!file) return send(res, 403, 'Forbidden', 'text/plain');
  const target = fs.existsSync(file) && fs.statSync(file).isFile() ? file : safeJoin(root, 'index.html');
  if (!target || !fs.existsSync(target)) return send(res, 404, 'Not found', 'text/plain');
  const ext = path.extname(target).toLowerCase();
  const cache = /\.(?:css|js|jpg|jpeg|png|svg|webp|ico)$/i.test(target) ? 'public, max-age=2592000, immutable' : 'no-store';
  res.writeHead(200, { 'content-type': mime[ext] || 'application/octet-stream', 'cache-control': cache });
  fs.createReadStream(target).pipe(res);
}

const css = `
:root{--bg:#070914;--panel:#0d1224;--panel2:#111936;--text:#f4f7fb;--muted:#9aa8c7;--line:#26314f;--brand:#77f2c1;--brand2:#70a7ff;--bad:#ff6d85;--warn:#ffd166}*{box-sizing:border-box}body{margin:0;font-family:Inter,ui-sans-serif,system-ui,-apple-system,Segoe UI,sans-serif;background:radial-gradient(circle at top left,#17234b,transparent 34rem),linear-gradient(180deg,#070914,#090d18);color:var(--text)}a{color:inherit}.wrap{max-width:1180px;margin:0 auto;padding:28px}.nav{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:28px}.brand{font-weight:900;letter-spacing:-.04em;font-size:24px}.pill{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);background:#111936cc;border-radius:999px;padding:8px 12px;color:var(--muted);font-size:13px}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:14px;padding:12px 16px;font-weight:800;background:linear-gradient(135deg,var(--brand),var(--brand2));color:#06101b;text-decoration:none;cursor:pointer}.btn.ghost{background:#121a33;color:var(--text);border:1px solid var(--line)}.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:22px}.card{background:linear-gradient(180deg,#101832e8,#0b1020e8);border:1px solid var(--line);border-radius:24px;padding:22px;box-shadow:0 20px 80px #0005}.hero{padding:38px}.hero h1{font-size:58px;line-height:.95;letter-spacing:-.07em;margin:0 0 18px}.hero p{font-size:18px;line-height:1.6;color:var(--muted);margin:0 0 22px}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:22px}.kpi{background:#070b18;border:1px solid var(--line);border-radius:18px;padding:16px}.kpi b{font-size:24px;display:block}.muted{color:var(--muted)}.list{display:grid;gap:12px}.site{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;background:#090e1d;border:1px solid var(--line);border-radius:18px;padding:16px}.site h3{margin:0 0 6px}.site p{margin:0;color:var(--muted)}input,textarea,select{width:100%;border:1px solid var(--line);background:#080d1c;color:var(--text);border-radius:14px;padding:12px 13px;font:inherit}label{display:grid;gap:7px;font-size:13px;color:var(--muted);font-weight:700}.formgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.formgrid .full{grid-column:1/-1}.actions{display:flex;gap:10px;flex-wrap:wrap}.danger{background:#2a1020;color:#ffd5de;border:1px solid #5b1f35}.site-hero{min-height:100vh;background:linear-gradient(135deg,#061427,#062c3a 55%,#0f172a);}.site-hero.green{background:linear-gradient(135deg,#071f14,#0c3b2a 55%,#101828)}.site-hero.orange{background:linear-gradient(135deg,#261305,#4a280d 55%,#101828)}.public{max-width:1120px;margin:0 auto;padding:34px 24px}.public h1{font-size:64px;line-height:.94;letter-spacing:-.075em;margin:70px 0 18px}.public p{font-size:19px;line-height:1.65;color:#c9d7e8}.offer{display:inline-block;background:#fff;color:#07111f;border-radius:18px;padding:14px 18px;font-weight:900;margin:18px 0}.sections{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:40px}.section{background:#ffffff12;border:1px solid #ffffff22;border-radius:22px;padding:20px;backdrop-filter:blur(10px)}.footer{margin-top:48px;padding-top:22px;border-top:1px solid #ffffff22;color:#c9d7e8}@media(max-width:860px){.grid,.formgrid,.sections{grid-template-columns:1fr}.hero h1,.public h1{font-size:42px}.wrap{padding:18px}}`;

function layout(title, content) { return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${css}</style></head><body>${content}</body></html>`; }

function adminPage() {
  const db = readDb();
  const items = db.sites.map(s => `<div class="site"><div><h3>${esc(s.name)}</h3><p>/${esc(s.slug)} · ${esc(s.industry || 'No industry')} · ${esc(s.status)}</p></div><div class="actions"><a class="btn ghost" href="/${esc(s.slug)}" target="_blank">Preview</a><button class="btn ghost" onclick='editSite(${JSON.stringify(s).replaceAll("'", '&#39;')})'>Edit</button><button class="btn danger" onclick="deleteSite('${esc(s.id)}')">Delete</button></div></div>`).join('');
  return layout('XT3 Demo Platform', `<div class="wrap"><div class="nav"><div><div class="brand">XT3 Demo Platform</div><div class="muted">Path-based client website previews on demo.xt3.us</div></div><span class="pill">${db.sites.length} sites</span></div><div class="grid"><section class="card hero"><span class="pill">Admin dashboard</span><h1>Spin up client preview sites without DNS hell.</h1><p>Add a client, paste their current URL/social/contact/context, and publish a clean preview at <b>/client-slug</b>.</p><div class="kpis"><div class="kpi"><b>${db.sites.length}</b><span class="muted">Sites</span></div><div class="kpi"><b>1</b><span class="muted">Domain</span></div><div class="kpi"><b>0</b><span class="muted">Cloudflare upsells</span></div></div></section><section class="card"><h2 id="formTitle">Create site</h2><form id="siteForm" class="list"><input type="hidden" name="id"><div class="formgrid"><label>Name<input name="name" required placeholder="Local Coffee Shop"></label><label>Slug<input name="slug" placeholder="local-coffee-shop"></label><label>Industry<input name="industry" placeholder="Cafe / Med spa / Contractor"></label><label>Location<input name="location" placeholder="City, ST"></label><label class="full">Current website<input name="currentUrl" placeholder="https://..."></label><label>Phone<input name="phone"></label><label>Email<input name="email"></label><label>Socials<input name="socials" placeholder="Instagram, Facebook, TikTok"></label><label>Palette<select name="palette"><option value="blue">Blue</option><option value="green">Green</option><option value="orange">Orange</option></select></label><label>Status<select name="status"><option value="published">Published</option><option value="draft">Draft</option></select></label><label class="full">Headline<textarea name="headline" rows="2" required></textarea></label><label class="full">Subheadline<textarea name="subheadline" rows="3"></textarea></label><label class="full">Offer<textarea name="offer" rows="2"></textarea></label><label class="full">Notes / raw client info<textarea name="notes" rows="4"></textarea></label></div><div class="actions"><button class="btn" type="submit">Save site</button><button class="btn ghost" type="button" onclick="resetForm()">New blank</button></div></form></section></div><section class="card" style="margin-top:22px"><h2>Sites</h2><div class="list">${items || '<p class="muted">No sites yet.</p>'}</div></section></div><script>
const form = document.getElementById('siteForm');
function resetForm(){ form.reset(); form.id.value=''; document.getElementById('formTitle').textContent='Create site'; }
function editSite(s){ document.getElementById('formTitle').textContent='Edit site'; for (const [k,v] of Object.entries(s)) if(form[k] && typeof v !== 'object') form[k].value = v || ''; scrollTo({top:0,behavior:'smooth'}); }
form.addEventListener('submit', async e => { e.preventDefault(); const data = Object.fromEntries(new FormData(form).entries()); const r = await fetch('/api/sites' + (data.id ? '/' + data.id : ''), { method: data.id ? 'PUT':'POST', headers:{'content-type':'application/json'}, body: JSON.stringify(data)}); if(!r.ok) alert(await r.text()); else location.reload(); });
async function deleteSite(id){ if(confirm('Delete this demo site?')) { await fetch('/api/sites/'+id,{method:'DELETE'}); location.reload(); } }
</script></body></html>`);
}

function publicSite(site) {
  const sections = (site.sections?.length ? site.sections : [
    { title: 'What we fix', body: site.notes || 'A clearer offer, stronger proof, better calls to action, and a page that makes the next step obvious.' },
    { title: 'Why choose us', body: 'Built around speed, trust, and a no-confusion buying path.' },
    { title: 'Next step', body: site.offer || 'Request a quote and get a fast response.' }
  ]).map(x => `<div class="section"><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></div>`).join('');
  return layout(site.name, `<main class="site-hero ${esc(site.palette || 'blue')}"><div class="public"><div class="nav"><div class="brand">${esc(site.name)}</div><a class="btn" href="mailto:${esc(site.email || '')}">Get a quote</a></div><span class="pill">${esc(site.industry || 'Local business')} · ${esc(site.location || 'Preview')}</span><h1>${esc(site.headline || site.name)}</h1><p>${esc(site.subheadline || 'A sharper client preview generated from business context, links, and positioning notes.')}</p>${site.offer ? `<div class="offer">${esc(site.offer)}</div>` : ''}<div class="sections">${sections}</div><div class="footer"><b>Contact</b><p>${esc(site.phone || '')} ${site.email ? '· ' + esc(site.email) : ''} ${site.socials ? '· ' + esc(site.socials) : ''}</p><p><a href="/admin">Admin</a> · Preview URL: /${esc(site.slug)}</p></div></div></main>`);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const firstSegment = url.pathname.split('/').filter(Boolean)[0] || '';
    if (staticSites[firstSegment]) return serveStaticSite(req, res, url, firstSegment, staticSites[firstSegment]);
    if (url.pathname === '/' || url.pathname === '/admin') return send(res, 200, adminPage());
    if (url.pathname === '/health') return send(res, 200, 'OK', 'text/plain');
    if (url.pathname === '/api/sites' && req.method === 'GET') return json(res, 200, readDb().sites);
    if (url.pathname === '/api/sites' && req.method === 'POST') {
      const d = await body(req); const db = readDb(); const now = new Date().toISOString();
      const slug = slugify(d.slug || d.name); if (db.sites.some(s => s.slug === slug)) return json(res, 409, { error: 'Slug already exists' });
      const site = { id: crypto.randomUUID(), slug, sections: [], links: [], createdAt: now, updatedAt: now, ...d, slug };
      db.sites.unshift(site); writeDb(db); return json(res, 201, site);
    }
    const m = url.pathname.match(/^\/api\/sites\/([^/]+)$/);
    if (m && req.method === 'PUT') {
      const d = await body(req); const db = readDb(); const i = db.sites.findIndex(s => s.id === m[1]); if (i < 0) return json(res, 404, { error: 'Not found' });
      const slug = slugify(d.slug || d.name); if (db.sites.some(s => s.slug === slug && s.id !== m[1])) return json(res, 409, { error: 'Slug already exists' });
      db.sites[i] = { ...db.sites[i], ...d, slug, updatedAt: new Date().toISOString() }; writeDb(db); return json(res, 200, db.sites[i]);
    }
    if (m && req.method === 'DELETE') { const db = readDb(); db.sites = db.sites.filter(s => s.id !== m[1]); writeDb(db); return json(res, 200, { ok: true }); }
    const slug = decodeURIComponent(url.pathname.split('/').filter(Boolean)[0] || '');
    const site = readDb().sites.find(s => s.slug === slug && s.status !== 'draft');
    if (site) return send(res, 200, publicSite(site));
    return send(res, 404, layout('Not found', `<div class="wrap"><div class="card"><h1>Not found</h1><p class="muted">No published demo exists for ${esc(url.pathname)}.</p><a class="btn" href="/admin">Back to admin</a></div></div>`));
  } catch (e) { console.error(e); return json(res, 500, { error: e.message }); }
});
server.listen(PORT, () => console.log(`XT3 Demo Platform listening on ${PORT}, data=${DB_FILE}`));
