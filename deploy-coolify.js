import http from 'node:http';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE = process.env.COOLIFY_BASE || 'http://Ians-Mac-mini.local:18000';
const tokenRaw = fs.readFileSync('../.coolify-token.tmp', 'utf8').trim();
const TOK = tokenRaw.includes('=') ? tokenRaw.split('=').slice(1).join('=').replace(/^['"]|['"]$/g, '') : tokenRaw;
const PROJECT_NAME = 'XT3 Demo Platform';
const APP_NAME = 'xt3-demo-platform';
const DOMAIN = 'http://demo.xt3.us';

function call(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE + path);
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = http.request({ method, hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers: { Authorization: 'Bearer ' + TOK, Accept: 'application/json', ...(data ? { 'content-type': 'application/json', 'content-length': data.length } : {}) } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}
const get = p => call('GET', p);
const post = (p,b) => call('POST', p, b);
const del = p => call('DELETE', p);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function parse(r, label) { try { return JSON.parse(r.body || '{}'); } catch { throw new Error(`${label} invalid JSON ${r.status}: ${r.body.slice(0,300)}`); } }
function must(r, label, ok=[200,201]) { if (!ok.includes(r.status)) throw new Error(`${label} failed ${r.status}: ${r.body.slice(0,1000)}`); return parse(r, label); }

async function main() {
  const health = await get('/api/v1/health');
  console.log('Coolify health:', health.status, health.body.trim());
  let projects = must(await get('/api/v1/projects'), 'list projects');
  if (!Array.isArray(projects)) projects = projects.data || [];
  let project = projects.find(p => p.name === PROJECT_NAME);
  if (!project) { project = must(await post('/api/v1/projects', { name: PROJECT_NAME, description: 'Path-based client website demo platform at demo.xt3.us' }), 'create project'); console.log('Created project:', project.uuid); }
  else console.log('Reusing project:', project.uuid);
  const projectDetail = must(await get(`/api/v1/projects/${project.uuid}`), 'project detail');
  const env = projectDetail.environments?.[0];
  if (!env) throw new Error('No project environment found');
  let servers = must(await get('/api/v1/servers'), 'list servers');
  if (!Array.isArray(servers)) servers = servers.data || [];
  const server = servers.find(s => s.is_coolify_host) || servers[0];
  if (!server) throw new Error('No Coolify server found');
  console.log('Server:', server.uuid, server.name || '(unnamed)');
  let apps = must(await get('/api/v1/applications'), 'list apps');
  if (!Array.isArray(apps)) apps = apps.data || [];
  const conflicts = apps.filter(a => a.name === APP_NAME || String(a.fqdn || a.domains || '').includes('demo.xt3.us'));
  for (const a of conflicts) {
    console.log('Deleting previous conflicting app:', a.uuid, a.name || '', a.fqdn || a.domains || '');
    const rd = await del(`/api/v1/applications/${a.uuid}?delete_volumes=false&docker_cleanup=true&delete_connected_networks=true`);
    if (![200,202,204].includes(rd.status)) console.log('Delete response:', rd.status, rd.body.slice(0,300));
    await sleep(3000);
  }
  const bundlePath = 'xt3-demo-platform.tar.gz';
  execFileSync('tar', ['-czf', bundlePath, 'package.json', 'server.js', 'client-sites'], { stdio: 'inherit' });
  const tarB64 = fs.readFileSync(bundlePath).toString('base64');
  const dockerfile = ['FROM node:20-alpine','RUN apk add --no-cache curl','WORKDIR /app',`RUN printf '%s' '${tarB64}' | base64 -d | tar -xz -C /app`,'ENV NODE_ENV=production','ENV PORT=80','ENV DATA_DIR=/data','VOLUME ["/data"]','EXPOSE 80','CMD ["node", "server.js"]',''].join('\n');
  const dockerfileB64 = Buffer.from(dockerfile, 'utf8').toString('base64');
  const payload = { project_uuid: project.uuid, server_uuid: server.uuid, environment_name: env.name || 'production', environment_uuid: env.uuid, name: APP_NAME, description: 'XT3 path-based admin platform for client website demos.', build_pack: 'dockerfile', dockerfile: dockerfileB64, ports_exposes: '80', domains: DOMAIN, instant_deploy: true, autogenerate_domain: false, is_force_https_enabled: false, health_check_enabled: true, health_check_path: '/health', health_check_port: '80', health_check_method: 'GET', health_check_return_code: 200, health_check_scheme: 'http', health_check_interval: 30, health_check_timeout: 10, health_check_retries: 3, health_check_start_period: 10, force_domain_override: true };
  const created = must(await post('/api/v1/applications/dockerfile', payload), 'create app', [200,201]);
  const appUuid = created.uuid;
  console.log('Created app:', appUuid, created.domains || created.fqdn || DOMAIN);
  let finished = false;
  for (let i = 0; i < 50; i++) {
    const d = await get(`/api/v1/deployments/applications/${appUuid}`);
    if (d.status === 404) { await sleep(5000); continue; }
    const parsed = must(d, 'deployments');
    const last = parsed.deployments?.[0];
    if (!last) { console.log(`[${i}] no deployment yet`); await sleep(5000); continue; }
    console.log(`[${i}] deployment=${last.deployment_uuid} status=${last.status}`);
    if (last.status === 'finished') { finished = true; break; }
    if (last.status === 'failed') { try { console.log(JSON.parse(last.logs).map(e => `[${e.type}] ${e.output}`).join('\n').slice(-4000)); } catch {} throw new Error('Deployment failed'); }
    await sleep(6000);
  }
  if (!finished) throw new Error('Timed out waiting for deployment');
  for (let i = 0; i < 20; i++) {
    const app = must(await get(`/api/v1/applications/${appUuid}`), 'app detail');
    const st = app.docker_status || app.status || '';
    console.log(`[${i}] docker=${st}`);
    if (String(st).includes('running')) break;
    await sleep(5000);
  }
  console.log('FINAL_APP_UUID=' + appUuid);
  console.log('FINAL_URL=https://demo.xt3.us/admin');
}
main().catch(e => { console.error(e.message || e); process.exit(1); });
