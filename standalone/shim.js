/* Local data layer: stores data in the browser and syncs through a shared file. */
(()=>{
if(window.appHost&&window.appHost.use)return;
const IDBN='sic-logbook',ST='kv',M=new Map();let idb=null,handle=null,last=0,lastMod=0,pt=0;
const fstat={mode:'local',at:0,err:''},FS=!!(window.showSaveFilePicker&&window.showOpenFilePicker);
const now=()=>last=Math.max(Date.now(),last+1),note=()=>window.dispatchEvent(new Event('sic-sync'));
const PRIV=p=>p.startsWith('data/users/');
const openIdb=()=>new Promise(r=>{try{const q=indexedDB.open(IDBN,1);q.onupgradeneeded=()=>q.result.createObjectStore(ST);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null);q.onblocked=()=>r(null)}catch(e){r(null)}});
const kvAll=()=>new Promise(r=>{if(!idb)return r(null);const o=[];try{const q=idb.transaction(ST).objectStore(ST).openCursor();q.onsuccess=()=>{const c=q.result;if(c){o.push([c.key,c.value]);c.continue()}else r(o)};q.onerror=()=>r(null)}catch(e){r(null)}});
const kvPut=(k,v)=>{if(idb)try{idb.transaction(ST,'readwrite').objectStore(ST).put(v,k);return}catch(e){}if(!(v instanceof Object)||v.constructor===Object)try{localStorage.setItem('sic:'+k,JSON.stringify(v))}catch(e){}};
const kvDel=k=>{if(idb)try{idb.transaction(ST,'readwrite').objectStore(ST).delete(k)}catch(e){}try{localStorage.removeItem('sic:'+k)}catch(e){}};
const L=[];let pend=new Set(),fq=false;
const colSnap=c=>{const docs=[];M.forEach((r,p)=>{if(!r.d&&p.startsWith(c+'/')&&!p.slice(c.length+1).includes('/'))docs.push({id:p.slice(c.length+1),data:()=>structuredClone(r.v)})});return{docs}};
const docSnap=p=>{const r=M.get(p);return r&&!r.d?{exists:true,id:p,data:()=>structuredClone(r.v)}:{exists:false,id:p,data:()=>undefined}};
const emit=l=>Promise.resolve().then(()=>{try{l.cb(l.col?colSnap(l.key):docSnap(l.key))}catch(e){console.error(e)}});
function fire(ps){ps.forEach(p=>pend.add(p));if(fq)return;fq=true;Promise.resolve().then(()=>{fq=false;const s=pend;pend=new Set();L.forEach(l=>{if(l.col?[...s].some(p=>p.startsWith(l.key+'/')):s.has(l.key))emit(l)})})}
function write(p,rec){M.set(p,rec);kvPut('d:'+p,rec);fire([p]);if(!PRIV(p))push_()}
const ref=p=>({id:p.split('/').pop(),get:async()=>{await ready;return docSnap(p)},set:async o=>{await ready;write(p,{v:structuredClone(o),u:now(),d:0})},delete:async()=>{await ready;write(p,{v:null,u:now(),d:1})},
 onSnapshot(cb,er){const l={col:false,key:p,cb};L.push(l);ready.then(()=>emit(l));return()=>{const i=L.indexOf(l);if(i>=0)L.splice(i,1)}}});
const dbApi={doc:ref,collection:c=>({doc:id=>ref(c+'/'+id),onSnapshot(cb,er){const l={col:true,key:c,cb};L.push(l);ready.then(()=>emit(l));return()=>{const i=L.indexOf(l);if(i>=0)L.splice(i,1)}}})};
const blobDl=(name,blob)=>{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)};
const mime=n=>/\.json$/.test(n)?'application/json':/\.html?$/.test(n)?'text/html':'text/plain';
const dlApi={save:async({filename,data})=>blobDl(filename,data instanceof Blob?data:new Blob([typeof data==='string'?data:JSON.stringify(data)],{type:mime(filename)}))};
let uid=null;try{uid=localStorage.getItem('sic:uid');if(!uid){uid=Math.random().toString(36).slice(2)+Date.now().toString(36);localStorage.setItem('sic:uid',uid)}}catch(e){uid='local'}
window.appHost={use:async n=>{await ready;return n==='db'?dbApi:n==='user'?{id:async()=>uid}:n==='downloads'?dlApi:null}};
/* sharing */
const docsOut=()=>{const o={};M.forEach((r,p)=>{if(PRIV(p))return;if(r.d&&r.u<Date.now()-15552e6)return;o[p]=r});return o};
const pack=()=>JSON.stringify({app:'sic-logbook',v:1,saved:new Date().toISOString(),docs:docsOut()});
function mergeIn(docs){const ch=new Set();for(const p in docs){if(PRIV(p))continue;const r=docs[p];if(!r||typeof r.u!=='number')continue;const l=M.get(p);if(!l||r.u>l.u){const n={v:r.d?null:r.v,u:r.u,d:r.d?1:0};M.set(p,n);kvPut('d:'+p,n);ch.add(p)}}if(ch.size)fire(ch);return ch.size}
function fromBackup(d){const o={},u=Date.parse(d.exported)||1;for(const c of['teachers','classes','students','logs','hw','assess'])if(Array.isArray(d[c]))d[c].forEach(x=>{if(x&&x.id)o[c+'/'+x.id]={v:x,u,d:0}});if(d.cfg&&typeof d.cfg==='object')o['cfg/main']={v:d.cfg,u,d:0};return o}
const perm=async(h,ask)=>{const o={mode:'readwrite'};try{if(await h.queryPermission(o)==='granted')return true;return ask&&await h.requestPermission(o)==='granted'}catch(e){return false}};
let dirty=false,tries=0;
const chk=d=>{let x=false;M.forEach((r,p)=>{if(PRIV(p))return;const o=d[p];if(!o||o.u<r.u)x=true});return x};
async function pull(force,quiet){if(!handle)return 0;if(!await perm(handle,false)){fstat.mode='perm';note();return 0}try{const f=await handle.getFile();if(!force&&f.lastModified===lastMod)return 0;const t=await f.text();let n=0;dirty=true;if(t.trim()){const j=JSON.parse(t);if(j&&j.docs){n=mergeIn(j.docs);dirty=chk(j.docs)}}else dirty=M.size>0;lastMod=f.lastModified;fstat.mode='linked';fstat.err='';fstat.at=Date.now();note();if(dirty&&!quiet)push_();return n}catch(e){fstat.err=e.message||'Read failed';note();return 0}}
async function push(){if(!handle)return;if(!await perm(handle,false)){fstat.mode='perm';note();return}try{await pull(true,true);const w=await handle.createWritable();await w.write(pack());await w.close();await pull(true,true);fstat.mode='linked';fstat.err='';fstat.at=Date.now();note();if(dirty&&tries++<4)push_();else if(!dirty)tries=0}catch(e){fstat.err=e.message||'Write failed';note()}}
function push_(){if(!handle)return;clearTimeout(pt);pt=setTimeout(push,1500)}
async function pick(kind){const ty=[{description:'Logbook data',accept:{'application/json':['.json']}}];let h;if(kind==='save')h=await showSaveFilePicker({suggestedName:'sic-logbook-shared.json',types:ty});else[h]=await showOpenFilePicker({types:ty,multiple:false});if(!await perm(h,true))throw new Error('Permission denied');handle=h;kvPut('m:handle',h);fstat.mode='linked';await pull(true);await push()}
const ready=(async()=>{idb=await openIdb();let all=await kvAll();if(!all){all=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k.startsWith('sic:d:'))all.push([k.slice(4),JSON.parse(localStorage.getItem(k))])}}catch(e){}}
 for(const[k,v]of all){if(k.startsWith('d:'))M.set(k.slice(2),v);else if(k==='m:handle'&&v&&v.getFile)handle=v;last=Math.max(last,(v&&v.u)||0)}
 try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
 if(handle){fstat.mode='linked';pull(true)}})();
setInterval(()=>{if(document.visibilityState==='visible')pull()},20000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')pull()});
window.SICSync={FS,get st(){return{...fstat,linked:!!handle,name:handle?handle.name:''}},link:()=>pick('save'),join:()=>pick('open'),
 unlink:async()=>{handle=null;kvDel('m:handle');fstat.mode='local';fstat.err='';note()},
 reconnect:async()=>{if(handle&&await perm(handle,true)){await pull(true);await push()}note()},now:async()=>{await push()},
 exportDl:()=>blobDl('sic-logbook-share-'+new Date().toISOString().slice(0,10)+'.json',new Blob([pack()],{type:'application/json'})),
 importText:async t=>{await ready;const j=JSON.parse(t);const d=j&&j.docs?j.docs:j&&(j.logs||j.students||j.classes||j.teachers)?fromBackup(j):null;if(!d)throw new Error('Not a logbook file');const n=mergeIn(d);if(n)push_();return n},ready};
})();
