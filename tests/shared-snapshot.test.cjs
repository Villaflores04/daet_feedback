const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
let results;
let configured=true;
const db={from(table){const q={select(){return q},order(){return q},limit(){return q},then(resolve,reject){return Promise.resolve(results[table]).then(resolve,reject)}};return q}};
const mocks={
 'next/server':{NextResponse:{json:(body,init={})=>({body,status:init.status||200})}},
 '@/lib/pulse/scope':{},
 '@/lib/supabase-server':{supabaseServer:()=>{if(!configured)throw Error('Supabase is not configured');return db}},
};
const mod={exports:{}};
new Function('exports','require','module',ts.transpileModule(fs.readFileSync('app/api/pulse/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(mod.exports,id=>mocks[id],mod);
(async()=>{
 results={channels:{data:[{id:'old-place',slug:'place',name:'Old place'}]},pulses:{data:[{id:'old-comment',channel_id:'old-place',face:'happy'}]},wishes:{error:{code:'42P01'}}};
 let r=await mod.exports.GET();assert.equal(r.status,200);assert.equal(r.body.channels[0].id,'old-place');assert.equal(r.body.pulses[0].id,'old-comment');assert.equal(r.body.wishes,null);assert.equal(r.body.issues.length,1);
 results.pulses={error:{message:'network failed'}};
 r=await mod.exports.GET();assert.equal(r.status,200);assert.equal(r.body.pulses,null);assert.equal(r.body.channels.length,1);
 results.channels={error:{code:'42501'}};
 r=await mod.exports.GET();assert.equal(r.status,503);assert.match(r.body.error,/credentials/);
 configured=false;r=await mod.exports.GET();assert.equal(r.status,503);assert.match(r.body.error,/Vercel environment/);
 console.log('PASS: independent table loads, explicit null failures, total failure and missing-config diagnostics');
})().catch(e=>{console.error(e);process.exit(1)});
