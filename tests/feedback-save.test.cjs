const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
let savedResult = { ok: false, error: 'Offline' };
let saves = 0;
let uploadResult = { ok: false, error: 'Upload failed' };
const mocks = {
 'zustand': require('zustand'),
 'zustand/middleware': { persist: fn => fn, createJSONStorage: () => ({}) },
 './ids': { uid: () => 'generated-id', slugify: s => s },
 './scope': { OVERALL_ID: 'feedback-overall-daet', OVERALL_CHANNEL: { id: 'feedback-overall-daet' } },
 './photos': { isRemotePhoto: s => s.startsWith('https://'), getPhotoBlob: async () => new Blob(['photo']), ingestDataUrl: async s => s },
 './seed': { SEED_CHANNELS: [], SEED_PULSES: [] },
 './remote': {
   saveSharedPulse: async pulse => { saves++; return savedResult.ok ? {ok:true,data:pulse} : savedResult; },
   uploadSharedPhoto: async () => uploadResult,
 },
};
const mod = {exports:{}};
new Function('exports','require','module',ts.transpileModule(fs.readFileSync('src/lib/pulse/store.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,id=>{if(!(id in mocks))throw Error(id);return mocks[id]},mod);
const store = mod.exports.usePulse;
(async()=>{
 const draft={id:'stable-retry-id',channelId:'place',callsign:'Visitor',face:'happy',body:'Good'};
 await assert.rejects(store.getState().addPulse(draft),/Offline/);
 assert.equal(store.getState().pulses.length,0,'failed requests must not create local success');
 savedResult={ok:true};
 const saved=await store.getState().addPulse(draft);
 assert.equal(saved.id,draft.id);
 assert.equal(store.getState().pulses.length,1);
 await store.getState().addPulse(draft);
 assert.equal(store.getState().pulses.length,1,'retry must not duplicate cached row');
 const previousSaves=saves;
 await assert.rejects(store.getState().addPulse({...draft,id:'photo-failure',photo:'local-photo'}),/Upload failed/);
 assert.equal(saves,previousSaves,'failed uploads must not publish missing photos');
 uploadResult={ok:true,data:'https://example.test/photo.jpg'};
 const photo=await store.getState().addPulse({...draft,id:'photo-success',photo:'local-photo'});
 assert.equal(photo.photo,uploadResult.data);
 console.log('PASS: confirmed saves, failed-save state, retry identity, no duplicate cache, upload failure and shared photo URL');
})().catch(e=>{console.error(e);process.exit(1)});
