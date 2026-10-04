const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
new Function('exports', 'require', 'module', ts.transpileModule(fs.readFileSync('src/lib/storage-fetch.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(mod.exports, require, mod);
const { storageFetch, storageFailure, storageDiagnostic } = mod.exports;
const url = 'https://example.supabase.co/storage/v1/object/pulse-photos/test.jpg';
const options = { method: 'POST', headers: { 'x-upsert': 'true' }, body: new ArrayBuffer(10) };

test('upload recovery and failures', async () => {
  const original = global.fetch;
  try {
    let attempts = 0;
    global.fetch = async (_, init) => {
      assert.equal(init.body, options.body);
      assert.ok(init.signal);
      if (++attempts === 1) throw new TypeError('fetch failed');
      return new Response('{}', { status: 200 });
    };
    assert.equal((await storageFetch(url, options)).status, 200);
    assert.equal(attempts, 2);
    attempts = 0;
    global.fetch = async () => { attempts++; return new Response('{}', { status: attempts < 3 ? 503 : 200 }); };
    assert.equal((await storageFetch(url, options)).status, 200);
    assert.equal(attempts, 3);
    attempts = 0;
    global.fetch = async () => { attempts++; throw new TypeError('fetch failed'); };
    await assert.rejects(storageFetch(url, options));
    assert.equal(attempts, 3);
    attempts = 0;
    await assert.rejects(storageFetch('https://example.supabase.co/rest/v1/channels', options));
    assert.equal(attempts, 1, 'database writes must not be retried');
    attempts = 0;
    global.fetch = async () => { attempts++; return new Response('{}', { status: 403 }); };
    assert.equal((await storageFetch(url, options)).status, 403);
    assert.equal(attempts, 1);
    const failure = { message: 'fetch failed', originalError: { cause: { code: 'ENOTFOUND' } } };
    assert.equal(storageDiagnostic(failure), 'ENOTFOUND');
    assert.equal(storageFailure(failure).code, 'STORAGE_UNAVAILABLE');
    assert.equal(storageFailure({ statusCode: '403' }).code, 'STORAGE_AUTH');
    assert.equal(storageFailure({ message: 'Bucket not found' }).code, 'STORAGE_BUCKET');
    // Exercise the real SDK: its request must reach the retry transport unchanged.
    const { createClient } = require('@supabase/supabase-js');
    const client = createClient('https://example.supabase.co', 'test-key', { global: { fetch: storageFetch }, auth: { persistSession: false, autoRefreshToken: false } });
    attempts = 0;
    global.fetch = async () => {
      if (++attempts === 1) throw new TypeError('fetch failed');
      return Response.json({ Id: 'uploaded', Key: 'pulse-photos/test.jpg' });
    };
    const result = await client.storage.from('pulse-photos').upload('test.jpg', options.body, { upsert: true, contentType: 'image/jpeg' });
    assert.equal(result.error, null);
    assert.equal(attempts, 2);
  } finally { global.fetch = original; }
});
