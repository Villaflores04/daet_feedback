const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file) {
 const mod = { exports: {} };
 new Function('exports','require','module',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(mod.exports,require,mod);
 return mod.exports;
}
const {OVERALL_ID,OVERALL_CHANNEL}=load('src/lib/pulse/scope.ts');
const {tallyFaces}=load('src/lib/pulse/faces.ts');
assert.equal(OVERALL_CHANNEL.id,OVERALL_ID);
const entries=[
 {channelId:'beach',face:'sad',parentId:null},
 {channelId:OVERALL_ID,face:'wow',parentId:null},
 {channelId:OVERALL_ID,face:'sad',parentId:'reply'},
];
assert.deepEqual(tallyFaces(entries.filter(p=>p.channelId===OVERALL_ID)),{pos:1,mix:0,neg:0,total:1});
assert.deepEqual(tallyFaces(entries.filter(p=>p.channelId!==OVERALL_ID)),{pos:0,mix:0,neg:1,total:1});
console.log('PASS: overall-trip and destination ratings remain separate; reply emojis excluded');
