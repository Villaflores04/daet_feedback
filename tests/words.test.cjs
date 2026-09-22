const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
new Function('exports', 'require', 'module', ts.transpileModule(fs.readFileSync('src/lib/pulse/words.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(mod.exports, require, mod);
const { scanBody, scanPulses } = mod.exports;
for (const [text, expected] of [
  ['Good and affordable', 'POS'], ['Bad service', 'NEG'], ['Not clean', 'NEG'],
  ['Hindi maganda', 'NEG'], ['Di malinis', 'NEG'], ['Not bad', 'POS'],
  ["It isn't safe", 'NEG'], ['Not only beautiful but also clean', 'POS'],
  ['Maganda pero marumi', 'MIX'], ['Beautiful but expensive', 'MIX'],
  ['The book is on the table', null], ['The skill is useful', null],
  ['Well-kept and peaceful', 'POS'], ['Okay', 'MIX'], ['', null],
  ['Not crowded. Good views.', 'POS'], ['Napakaganda at mabait ang staff', 'POS'],
]) assert.equal(scanBody(text), expected, text);
assert.equal(scanPulses([{ id: 'reply', parentId: 'root', body: 'Very good' }]).length, 1);
console.log('18 sentiment regression checks passed');
