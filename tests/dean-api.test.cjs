const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
function load(file,mocks){const m={exports:{}};new Function('exports','require','module',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(m.exports,id=>id in mocks?mocks[id]:require(id),m);return m.exports;}
const jar=new Map();
const json=(body,init={})=>({body,status:init.status||200,cookies:{set:(n,v)=>jar.set(n,v)}});
let counts={reacts_up:2,reacts_down:1},fail=false,conflict=false;
const db={from(){let patch,filters={};const q={select(){return q},eq(k,v){filters[k]=v;return q},update(p){patch=p;return q},single:async()=>({data:{...counts}}),then(resolve){if(fail)return resolve({error:{}});if(conflict){counts.reacts_up++;conflict=false;return resolve({data:[]})}Object.assign(counts,patch);return resolve({data:[{id:'p1'}]})}};return q}};
const shared={'next/server':{NextResponse:{json}},'@/lib/desk-session':{sameOrigin:r=>r.headers.get('origin')==='https://example.test',equal:(a,b)=>a===b,hasDeskSession:async()=>false}};
const {reactionCounts}=load('src/lib/pulse/reactions.ts',{});
const route=load('app/api/pulse/reaction/route.ts',{...shared,'next/headers':{cookies:async()=>({get:n=>jar.has(n)?{value:jar.get(n)}:undefined})},'@/lib/supabase-server':{supabaseServer:()=>db},'@/lib/pulse/reactions':{reactionCounts}});
const previousKey=process.env.SUPABASE_SERVICE_ROLE_KEY;process.env.SUPABASE_SERVICE_ROLE_KEY='test-only-key';
function req(side,origin='https://example.test'){return new Request('https://example.test/api/pulse/reaction',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({id:'p1',side})})}
(async()=>{
 let r=await route.POST(req('up'));assert.equal(r.status,200);assert.equal(counts.reacts_up,3);
 r=await route.POST(req('up'));assert.equal(counts.reacts_up,3,'same desired state must not add again');
 r=await route.POST(req('down'));assert.deepEqual(counts,{reacts_up:2,reacts_down:2});
 r=await route.POST(req(null));assert.deepEqual(counts,{reacts_up:2,reacts_down:1});
 jar.set('daet-r-p1','up.tampered');r=await route.POST(req(null));assert.equal(counts.reacts_up,2,'forged previous vote must not decrement');
 conflict=true;r=await route.POST(req('up'));assert.equal(counts.reacts_up,4,'retry preserves another visitor’s concurrent increment');
 fail=true;r=await route.POST(req('down'));assert.equal(r.status,503);assert.equal(counts.reacts_down,1);fail=false;
 r=await route.POST(req('up','https://other.test'));assert.equal(r.status,403);
 const ai=load('app/api/desk/insights/route.ts',{...shared,'@/lib/supabase-server':{},'@/lib/pulse/insights':{}});
 assert.equal((await ai.POST(req('up'))).status,401,'AI requires server-authenticated admin');
 let metadata;
 const photo=load('app/api/pulse/photo/route.ts',{'next/server':{NextResponse:{json}},'@/lib/supabase-server':{supabaseStorageServer:()=>({storage:{from:()=>({upload:async(p,b,o)=>{metadata=o.metadata;return{}},getPublicUrl:()=>({data:{publicUrl:'https://example.test/photo.jpg'}})})}})},'@/lib/storage-fetch':{}});
 const form=new FormData();form.set('id','photo-test-001');form.set('file',new File(['image'],'photo.jpg',{type:'image/jpeg'}));
 assert.equal((await photo.POST({formData:async()=>form})).status,400,'photo permission required');
 form.set('consent','daet-photo-v1');assert.equal((await photo.POST({formData:async()=>form})).status,201);assert.equal(metadata.consent_version,'daet-photo-v1');assert.ok(metadata.consent_received_at);
 console.log('PASS: persisted reaction transitions, retry/no-op, tampered receipts, concurrency, save errors, origin, AI authentication and recorded photo consent');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>{if(previousKey===undefined)delete process.env.SUPABASE_SERVICE_ROLE_KEY;else process.env.SUPABASE_SERVICE_ROLE_KEY=previousKey});
