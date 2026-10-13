const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
let snapshotResult = { ok: false, error: "Offline" };
let savedResult = { ok: false, error: 'Offline' };
let saves = 0;
const previewCalls = [];
let uploadResult = { ok: false, error: 'Upload failed' };
const mocks = {
 '../rewards': { recordPreviewReward: pulse => previewCalls.push(pulse.id) },
 'zustand': require('zustand'),
 'zustand/middleware': { persist: fn => fn, createJSONStorage: () => ({}) },
 './ids': { uid: () => 'generated-id', slugify: s => s },
 './scope': { OVERALL_ID: 'feedback-overall-daet', OVERALL_CHANNEL: { id: 'feedback-overall-daet' } },
 './photos': { isRemotePhoto: s => s.startsWith('https://'), getPhotoBlob: async () => new Blob(['photo']), ingestDataUrl: async s => s },
 './seed': { SEED_CHANNELS: [], SEED_PULSES: [] },
 './remote': {
   fetchPulseSnapshot: async () => snapshotResult,
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
 assert.equal(previewCalls.length,0,'failed saves must not trigger reward previews');
 savedResult={ok:true};
 const saved=await store.getState().addPulse(draft);
 assert.equal(saved.id,draft.id);
 assert.deepEqual(previewCalls,[draft.id]);
 assert.equal(store.getState().pulses.length,1);
 await store.getState().addPulse(draft);
 assert.equal(store.getState().pulses.length,1,'retry must not duplicate cached row');
 const previousSaves=saves;
 const previousRewards=previewCalls.length;
 await assert.rejects(store.getState().addPulse({...draft,id:'photo-failure',photo:'local-photo'}),/Upload failed/);
 assert.equal(saves,previousSaves,'failed uploads must not publish missing photos');
 assert.equal(previewCalls.length,previousRewards,'failed uploads must not trigger rewards');
 uploadResult={ok:true,data:'https://example.test/photo.jpg'};
 const photo=await store.getState().addPulse({...draft,id:'photo-success',photo:'local-photo'});
 assert.equal(photo.photo,uploadResult.data);
 store.setState({ channels: [{id:'existing-place'}], pulses: [{id:'existing-feedback'}], wishes:[{id:'cached-wish'}] });
 await store.getState().syncShared();
 assert.equal(store.getState().syncStatus,'error');
 assert.equal(store.getState().pulses[0].id,'existing-feedback');
 snapshotResult={ok:true,data:{channels:[{id:'cloud-place'}],pulses:null,wishes:[],issues:['Feedback unavailable']}};
 await store.getState().syncShared();
 assert.equal(store.getState().syncStatus,'partial');
 assert.equal(store.getState().channels[0].id,'cloud-place');
 assert.equal(store.getState().pulses[0].id,'existing-feedback');
 assert.equal(store.getState().wishes.length,0,'a successful empty collection is authoritative');
 snapshotResult={ok:true,data:{channels:[],pulses:[],wishes:[],issues:[]}};
 await store.getState().syncShared();
 assert.equal(store.getState().syncStatus,'connected');
 assert.equal(store.getState().syncError,'');
 assert.equal(store.getState().pulses.length,0,'real deletions must not be resurrected');
 console.log('PASS: failed/partial sync preservation and recovery');
 console.log('PASS: confirmed saves, failed-save state, retry identity, no duplicate cache, upload failure and shared photo URL');
})().catch(e=>{console.error(e);process.exit(1)});
