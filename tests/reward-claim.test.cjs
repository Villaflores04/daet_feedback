const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const load = (file, req) => { const m = { exports: {} };
  new Function('exports', 'require', 'module', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(m.exports, req, m); return m.exports; };
const rewards = load('src/lib/rewards.ts', require);
const { claimFeedbackReward, IP_DAILY_CAP } = load('src/lib/reward-claim.ts', (n) => n === 'server-only' ? {} : n === './rewards' ? rewards : require(n));

function fakeDb(opts = {}) {
  const rows = [];
  return { rows, from() {
    const q = { f: [], head: false, count: null };
    const run = () => { let r = rows.filter(x => q.f.every(fn => fn(x)));
      if (opts.broken) return { error: { code: '42P01' } };
      return { data: r, count: r.length, error: null }; };
    const api = {
      select(_c, o) { q.head = Boolean(o && o.head); return api; },
      eq(k, v) { q.f.push(x => x[k] === v); return api; },
      gte(k, v) { q.f.push(x => x[k] >= v); return api; },
      maybeSingle() { const r = run(); return Promise.resolve(r.error ? r : { data: r.data[0] || null, error: null }); },
      insert(row) { if (opts.broken) return Promise.resolve({ error: { code: '42P01' } });
        if (rows.some(x => x.device_hash === row.device_hash)) return Promise.resolve({ error: { code: '23505' } });
        rows.push({ ...row, created_at: new Date().toISOString() }); return Promise.resolve({ error: null }); },
      then(res, rej) { return Promise.resolve(run()).then(res, rej); },
    }; return api; } };
}
const req = (ip) => new Request('https://x.test/api/pulse', { headers: { 'x-forwarded-for': ip } });
(async () => {
  const db = fakeDb();
  const key = 'device-key-aaaaaaaaaaaa';
  const a = await claimFeedbackReward(db, req('1.1.1.1'), key, 'f1');
  assert.deepEqual([a.awarded, a.points], [true, 15], 'first feedback earns 15');
  const retry = await claimFeedbackReward(db, req('1.1.1.1'), key, 'f1');
  assert.equal(retry.awarded, true, 'a retry of the same feedback is the same claim');
  const second = await claimFeedbackReward(db, req('1.1.1.1'), key, 'f2');
  assert.deepEqual([second.awarded, second.reason], [false, 'already'], 'second feedback from the same device earns nothing');
  assert.equal(db.rows.length, 1, 'only one claim row per device');
  assert.equal((await claimFeedbackReward(db, req('2.2.2.2'), 'short', 'f3')).reason, 'no-device');
  assert.equal((await claimFeedbackReward(db, req('2.2.2.2'), undefined, 'f3')).awarded, false);
  // many fresh device keys from one network (incognito spam) stop at the daily cap
  const spam = fakeDb(); let wins = 0, last;
  for (let i = 0; i < IP_DAILY_CAP + 5; i++) { last = await claimFeedbackReward(spam, req('9.9.9.9'), 'fresh-key-' + String(i).padStart(12, '0'), 'p' + i); if (last.awarded) wins++; }
  assert.equal(wins, IP_DAILY_CAP); assert.equal(last.reason, 'network-limit');
  assert.equal((await claimFeedbackReward(spam, req('8.8.8.8'), 'fresh-key-other-network', 'q1')).awarded, true, 'another network is unaffected');
  // missing table must not break feedback
  const broken = await claimFeedbackReward(fakeDb({ broken: true }), req('3.3.3.3'), key, 'f9');
  assert.deepEqual([broken.awarded, broken.reason], [false, 'unavailable']);
  assert.ok(!JSON.stringify(db.rows).includes(key), 'the raw device key is never stored');
  assert.ok(!JSON.stringify(db.rows).includes('1.1.1.1'), 'the raw address is never stored');
  console.log('PASS: one-time reward per device, retry safety, network daily cap, fail-safe and no raw identifiers stored');
})().catch(e => { console.error(e); process.exit(1); });
