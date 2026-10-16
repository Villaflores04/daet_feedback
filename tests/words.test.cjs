const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const mod = { exports: {} };
new Function('exports', 'require', 'module', ts.transpileModule(fs.readFileSync('src/lib/pulse/words.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText)(mod.exports, require, mod);
const { scanBody, scanPulses, tallyScans } = mod.exports;
const cases = [

  ['Good and affordable', 'POS'], ['Bad service', 'NEG'], ['Not clean', 'NEG'],
  ['Hindi maganda', 'NEG'], ['Di malinis', 'NEG'], ['Not bad', 'POS'],
  ["It isn't safe", 'NEG'], ['Not only beautiful but also clean', 'POS'],
  ['Maganda pero marumi', 'MIX'], ['Beautiful but expensive', 'MIX'],
  ['The book is on the table', null], ['The skill is useful', null],
  ['Well-kept and peaceful', 'POS'], ['Okay', 'MIX'], ['', null],
  ['Not crowded. Good views.', 'POS'], ['Napakaganda at mabait ang staff', 'POS'],
  ['Good, clean, beautiful, friendly, but dirty toilets', 'MIX'],
  ['Dirty, smelly, noisy, expensive, but beautiful views', 'MIX'],
  ['Nice place but bad service', 'MIX'],
  ['Maganda at malinis pero mahal', 'MIX'],
  ['Madumi at maingay pero mabait ang staff', 'MIX'],
  ['Good views pero maraming basura', 'MIX'],
  ['Beautiful and a bit crowded', 'MIX'],
  ['A bit crowded', 'NEG'], ['Medyo marumi', 'NEG'],
  ['Okay okay okay good', 'POS'], ['Okay okay okay bad', 'NEG'],
  ['Fine average clean', 'POS'], ['Fine average dirty', 'NEG'],
  ['Good good good bad', 'MIX'], ['Bad bad bad good', 'MIX'],
  ['Hindi maganda pero malinis', 'MIX'],
  ['Hindi maganda at marumi', 'NEG'],
  ['Hindi marumi at maganda', 'POS'],
  ['Not good but clean', 'MIX'], ['Not good and dirty', 'NEG'],
  ['Not bad and beautiful', 'POS'],
  ['Good but not safe', 'MIX'],
  ['Good! Bad.', 'MIX'], ['Bad. Good!', 'MIX'],
  ['Nice, pleasant and enjoyable', 'POS'],
  ['terrible, dirty and unsafe', 'NEG'],
];
for (const [text, expected] of cases) assert.equal(scanBody(text), expected, text);
assert.equal(scanPulses([{ id: 'reply', parentId: 'root', body: 'Very good' }]).length, 1);
const comments = [
  { id: 'good', body: 'Nice and clean' },
  { id: 'bad', body: 'Bad and dirty' },
  { id: 'both', body: 'Nice but dirty' },
  { id: 'reply', parentId: 'both', body: 'Maganda pero mahal' },
  { id: 'unknown', body: 'Visited yesterday' },
];
assert.deepEqual(tallyScans(scanPulses(comments)), { pos: 1, mix: 2, neg: 1, total: 4 });
console.log(`${cases.length} classification cases and reply/summary regression checks passed`);
