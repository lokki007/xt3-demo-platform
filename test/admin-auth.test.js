import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import net from 'node:net';
import test from 'node:test';
import assert from 'node:assert/strict';

async function freePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const { port } = server.address();
  server.close();
  await once(server, 'close');
  return port;
}

async function startApp() {
  const port = await freePort();
  const dataDir = await mkdtemp(path.join(tmpdir(), 'xt3-demo-'));
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(import.meta.dirname, '..'),
    env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, ADMIN_PASSWORD: 'test-pass' },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let output = '';
  child.stdout.on('data', chunk => { output += chunk.toString(); });
  child.stderr.on('data', chunk => { output += chunk.toString(); });

  const deadline = Date.now() + 5000;
  while (!output.includes('XT3 Demo Platform listening')) {
    if (child.exitCode !== null) throw new Error(`server exited early: ${output}`);
    if (Date.now() > deadline) throw new Error(`server did not start: ${output}`);
    await new Promise(resolve => setTimeout(resolve, 25));
  }

  return {
    base: `http://127.0.0.1:${port}`,
    async stop() {
      child.kill();
      await Promise.race([once(child, 'exit'), new Promise(resolve => setTimeout(resolve, 1000))]);
      await rm(dataDir, { recursive: true, force: true });
    }
  };
}

test('admin pages and API require the password while public previews stay open', async () => {
  const app = await startApp();
  try {
    const admin = await fetch(`${app.base}/admin`);
    assert.equal(admin.status, 200);
    assert.match(await admin.text(), /Admin access/);

    const root = await fetch(`${app.base}/`);
    assert.equal(root.status, 200);
    assert.match(await root.text(), /Admin access/);

    const api = await fetch(`${app.base}/api/sites`);
    assert.equal(api.status, 401);
    assert.deepEqual(await api.json(), { error: 'Admin password required' });

    const login = await fetch(`${app.base}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: 'test-pass' }),
      redirect: 'manual'
    });
    assert.equal(login.status, 303);
    const cookie = login.headers.get('set-cookie');
    assert.match(cookie, /xt3_admin=/);
    assert.match(cookie, /HttpOnly/);

    const authedApi = await fetch(`${app.base}/api/sites`, { headers: { cookie } });
    assert.equal(authedApi.status, 200);
    assert.equal(Array.isArray(await authedApi.json()), true);

    const preview = await fetch(`${app.base}/pure-pressure-power-washing/`);
    assert.equal(preview.status, 200);
    assert.match(await preview.text(), /Pure Pressure Power Washing/i);

    const health = await fetch(`${app.base}/health`);
    assert.equal(health.status, 200);
    assert.equal(await health.text(), 'OK');
  } finally {
    await app.stop();
  }
});

test('admin dashboard lists pushed static client sites without the create form', async () => {
  const app = await startApp();
  try {
    const login = await fetch(`${app.base}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: 'test-pass' }),
      redirect: 'manual'
    });
    const cookie = login.headers.get('set-cookie');

    const admin = await fetch(`${app.base}/admin`, { headers: { cookie } });
    assert.equal(admin.status, 200);
    const html = await admin.text();

    assert.doesNotMatch(html, /Create site/);
    assert.doesNotMatch(html, /Save site/);
    assert.match(html, /3 active sites/);
    assert.match(html, /Alexys Nevitt Voice Studio/);
    assert.match(html, /LakeShore Lawn Care/);
    assert.match(html, /Pure Pressure Power Washing/);
  } finally {
    await app.stop();
  }
});

test('admin can turn the public demo website off and back on', async () => {
  const app = await startApp();
  try {
    const login = await fetch(`${app.base}/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ password: 'test-pass' }),
      redirect: 'manual'
    });
    const cookie = login.headers.get('set-cookie');

    const livePreview = await fetch(`${app.base}/pure-pressure-power-washing/`);
    assert.equal(livePreview.status, 200);
    assert.match(await livePreview.text(), /Pure Pressure Power Washing/i);

    const turnOff = await fetch(`${app.base}/admin/demo-website`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ enabled: 'false' }),
      redirect: 'manual'
    });
    assert.equal(turnOff.status, 303);
    assert.equal(turnOff.headers.get('location'), '/admin');

    const admin = await fetch(`${app.base}/admin`, { headers: { cookie } });
    assert.equal(admin.status, 200);
    const adminHtml = await admin.text();
    assert.match(adminHtml, /Demo website is offline/);
    assert.match(adminHtml, /Turn on/);

    const offlinePreview = await fetch(`${app.base}/pure-pressure-power-washing/`);
    assert.equal(offlinePreview.status, 503);
    assert.match(await offlinePreview.text(), /Demo website is offline/);

    const health = await fetch(`${app.base}/health`);
    assert.equal(health.status, 200);

    const turnOn = await fetch(`${app.base}/admin/demo-website`, {
      method: 'POST',
      headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ enabled: 'true' }),
      redirect: 'manual'
    });
    assert.equal(turnOn.status, 303);

    const restoredPreview = await fetch(`${app.base}/pure-pressure-power-washing/`);
    assert.equal(restoredPreview.status, 200);
    assert.match(await restoredPreview.text(), /Pure Pressure Power Washing/i);
  } finally {
    await app.stop();
  }
});
