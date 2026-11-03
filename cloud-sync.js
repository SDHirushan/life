/* Optional cloud backup/restore of Life Quest data + original image blobs.
   Uses Supabase Auth, Postgres RLS and a PRIVATE Storage bucket.
   It never automatically replaces your local progress. */
(() => {
  'use strict';
  const cfg = window.LIFEQUEST_CLOUD_CONFIG;
  const sdk = window.supabase;
  const configured = cfg && /^https:\/\//.test(cfg.url) &&
    !cfg.url.includes('YOUR-PROJECT') && cfg.publishableKey &&
    !cfg.publishableKey.includes('YOUR-PUBLISHABLE');
  const client = configured && sdk?.createClient
    ? sdk.createClient(cfg.url, cfg.publishableKey) : null;
  const BUCKET = 'lifequest-photos';
  const STORES = [
    ['lifequest-hierarchy-photos-v1','photos'],
    ['lifequest-custom-photos','photos'],
    ['lifequest-month-vision-images','images']
  ];
  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'lifequest-cloud-open';
  button.textContent = '☁ Cloud';
  button.title = 'Private Life Quest backup and restore';
  document.querySelector('header')?.appendChild(button);
  const dialog = document.createElement('dialog');
  dialog.id = 'lifequest-cloud-dialog';
  dialog.setAttribute('aria-label','Cloud backup');
  dialog.innerHTML = `
    <h2>☁ Life Quest Cloud</h2>
    <p id="lqc-user">Sign in to keep your data in your own private cloud.</p>
    <label for="lqc-email">Email</label><input id="lqc-email" type="email" autocomplete="username">
    <label for="lqc-pass">Password</label><input id="lqc-pass" type="password" autocomplete="current-password">
    <div class="lqc-actions"><button id="lqc-signin">Sign in</button><button id="lqc-signup">Create account</button></div>
    <hr><p>Manual sync avoids overwriting changes made on another device.</p>
    <div class="lqc-actions"><button id="lqc-backup">⬆ Save to Cloud</button><button id="lqc-restore">⬇ Restore from Cloud</button></div>
    <div class="lqc-actions"><button id="lqc-signout">Sign out</button><button id="lqc-close">Close</button></div>
    <p id="lqc-status" role="status">Ready.</p>`;
  document.body.appendChild(dialog);
  const css = document.createElement('style');
  css.textContent = `
    #lifequest-cloud-dialog{max-width:460px;width:92vw;max-height:85vh;overflow:auto;background:#112319;color:#eff1df}
    #lifequest-cloud-dialog label{display:block;margin:13px 0 5px;color:#e5c784;font-size:12px}
    #lifequest-cloud-dialog input{display:block;box-sizing:border-box;width:100%;padding:11px;border-radius:7px;background:#0a1911;color:white;border:1px solid #536b4f}
    #lifequest-cloud-dialog p{font-size:12px;line-height:1.5}
    .lqc-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:13px}
    .lqc-actions button{flex:1;min-width:130px;font-size:11px}
    #lqc-status{color:#e5c784;min-height:30px;overflow-wrap:anywhere}
    #lifequest-cloud-open{font-size:11px;color:#e5c784}
    #lifequest-cloud-dialog hr{border:none;border-top:1px solid #3e5943;margin-top:18px}`;
  document.head.appendChild(css);
  const el = id => dialog.querySelector('#'+id);
  const say = message => { el('lqc-status').textContent = message; };
  let busy = false;
  async function user() {
    if (!client) throw new Error('First set your Supabase URL and publishable key in cloud-config.js.');
    const {data, error} = await client.auth.getUser();
    if (error || !data.user) throw new Error('Please sign in first.');
    return data.user;
  }
  async function sessionLabel() {
    try { const u = await user();el('lqc-user').textContent = `Signed in as ${u.email}`; }
    catch { el('lqc-user').textContent = 'Not signed in'; }
  }
  button.onclick = () => { dialog.showModal();sessionLabel();if(!client)say('Configure cloud-config.js first.'); };
  el('lqc-close').onclick = () => dialog.close();
  async function guarded(action) {
    if (busy) return;
    busy = true;
    dialog.querySelectorAll('button').forEach(b => {if(b.id!=='lqc-close')b.disabled=true;});
    try {await action();} catch(e) {say('Error: '+e.message);console.error('Life Quest cloud', e);} finally {
      busy=false;dialog.querySelectorAll('button').forEach(b=>b.disabled=false);sessionLabel();
    }
  }
  el('lqc-signup').onclick = () => guarded(async()=>{
    if(!client)throw new Error('Set up cloud-config.js first.');
    const {error}=await client.auth.signUp({email:el('lqc-email').value.trim(),password:el('lqc-pass').value});
    if(error)throw error;say('Account requested. Confirm your email if Supabase requires it, then sign in.');
  });
  el('lqc-signin').onclick = () => guarded(async()=>{
    if(!client)throw new Error('Set up cloud-config.js first.');
    const {error}=await client.auth.signInWithPassword({email:el('lqc-email').value.trim(),password:el('lqc-pass').value});
    if(error)throw error;say('Signed in. Choose Save or Restore.');el('lqc-pass').value='';
  });
  el('lqc-signout').onclick = () => guarded(async()=>{
    if(!client)return;const {error}=await client.auth.signOut();if(error)throw error;
    say('Signed out.');
  });

  function openStore(dbName,storeName) {
    return new Promise((resolve,reject)=>{
      const r=indexedDB.open(dbName,1);
      r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(storeName))r.result.createObjectStore(storeName);};
      r.onerror=()=>reject(r.error);
      r.onsuccess=()=>resolve(r.result);
    });
  }
  async function readStore(dbName,storeName) {
    const db=await openStore(dbName,storeName);
    try {
      return await new Promise((resolve,reject)=>{
        const tx=db.transaction(storeName,'readonly');const os=tx.objectStore(storeName);
        const keys=os.getAllKeys();const values=os.getAll();
        tx.oncomplete=()=>resolve(keys.result.map((key,i)=>({key, blob:values.result[i]})));
        tx.onerror=()=>reject(tx.error);
      });
    } finally {db.close();}
  }
  async function writeStore(dbName,storeName,entries) {
    const db=await openStore(dbName,storeName);
    try {
      await new Promise((resolve,reject)=>{
        const tx=db.transaction(storeName,'readwrite');const os=tx.objectStore(storeName);
        os.clear();for(const e of entries)os.put(e.blob,e.key);
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
        tx.onabort=()=>reject(tx.error);
      });
    }finally{db.close();}
  }
  function dataUrlBlob(dataUrl) {
    const [info,b64]=dataUrl.split(',');
    const mime=info.match(/^data:([^;]+);base64$/)?.[1]||'image/jpeg';
    const bytes=atob(b64),arr=new Uint8Array(bytes.length);
    for(let i=0;i<bytes.length;i++)arr[i]=bytes.charCodeAt(i);
    return new Blob([arr],{type:mime});
  }
  function blobDataUrl(blob){
    return new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);
      fr.onerror=()=>reject(fr.error);fr.readAsDataURL(blob);});
  }
  async function upload(path,blob) {
    const {error}=await client.storage.from(BUCKET).upload(path,blob,{
      upsert:true, contentType:blob.type||'application/octet-stream', cacheControl:'60'
    });
    if(error)throw new Error(`Upload ${path}: ${error.message}`);
  }
  async function download(path){
    const {data,error}=await client.storage.from(BUCKET).download(path);
    if(error)throw new Error(`Download ${path}: ${error.message}`);
    return data;
  }
  el('lqc-backup').onclick=()=>guarded(async()=>{
    const u=await user();
    say('Collecting local progress and photos...');
    const {data:previous, error:oldError} = await client.from('lifequest_snapshots')
      .select('payload').eq('user_id',u.id).maybeSingle();
    if(oldError)throw oldError;
    const snapshot={version:1,locals:{},localImages:[],photos:[],savedAt:new Date().toISOString()};
    for(let i=0;i<localStorage.length;i++){
      const key=localStorage.key(i);
      if(key?.startsWith('lifequest-'))snapshot.locals[key]=localStorage.getItem(key);
    }
    // Move embedded base64 images out of Postgres and into private Storage.
    for(const key of ['lifequest-v1','lifequest-annual-v1','lifequest-annual-weeks-v1']){
      if(!snapshot.locals[key])continue;
      const parsed=JSON.parse(snapshot.locals[key]);
      if(!parsed||typeof parsed!=='object')continue;
      for(const [recordKey,item] of Object.entries(parsed)){
        if(item && typeof item.image==='string' && item.image.startsWith('data:image/')){
          const path=`${u.id}/inline/${encodeURIComponent(key)}/${encodeURIComponent(recordKey)}`;
          say('Uploading saved year/month photos...');
          await upload(path,dataUrlBlob(item.image));
          snapshot.localImages.push({key,recordKey,path});
          item.image='';
        }
      }
      snapshot.locals[key]=JSON.stringify(parsed);
    }
    for(const [db,store] of STORES){
      for(const item of await readStore(db,store)){
        if(!(item.blob instanceof Blob))continue;
        const path=`${u.id}/${db}/${encodeURIComponent(String(item.key))}`;
        say(`Uploading ${db} photos...`);
        await upload(path,item.blob);
        snapshot.photos.push({db,store,key:item.key,path});
      }
    }
    const {error}=await client.from('lifequest_snapshots').upsert({user_id:u.id,payload:snapshot,updated_at:new Date().toISOString()});
    if(error)throw error;
    // When the user deletes a photo locally and backs up again, also remove
    // the old file from the cloud. Never delete before the snapshot commits.
    const oldPaths=[...(previous?.payload?.photos||[]),...(previous?.payload?.localImages||[])]
      .map(item=>item.path).filter(Boolean);
    const fresh=new Set([...snapshot.photos,...snapshot.localImages].map(item=>item.path));
    const stale=oldPaths.filter(path=>path.startsWith(u.id+'/')&&!fresh.has(path));
    if(stale.length){
      const {error:removeError}=await client.storage.from(BUCKET).remove(stale);
      if(removeError){
        say('Backup saved, but some deleted photos remain in cloud storage: '+removeError.message);
        return;
      }
    }
    say(`Cloud backup completed: ${snapshot.photos.length+snapshot.localImages.length} photos and all Life Quest progress saved.`);
  });
  el('lqc-restore').onclick=()=>guarded(async()=>{
    const u=await user();
    if(!confirm('Restore cloud data? This will REPLACE your local Life Quest progress and photos. Back up your current device first.'))return;
    const {data,error}=await client.from('lifequest_snapshots').select('payload,updated_at').eq('user_id',u.id).maybeSingle();
    if(error)throw error;
    if(!data?.payload)throw new Error('No cloud backup found. Save from your original device first.');
    const snap=data.payload;
    if(snap.version!==1 || !snap.locals || !Array.isArray(snap.photos))throw new Error('Unsupported backup format.');
    // Fetch everything first, BEFORE modifying the current device.
    const toWrite=new Map(STORES.map(([db,store])=>[db+'|'+store,[]]));
    for(const rec of snap.photos){
      if(!toWrite.has(rec.db+'|'+rec.store))continue;
      say(`Downloading ${rec.db} image...`);
      toWrite.get(rec.db+'|'+rec.store).push({key:rec.key,blob:await download(rec.path)});
    }
    const locals={...snap.locals};
    for(const rec of snap.localImages||[]){
      say('Downloading original year/month photos...');
      if(typeof locals[rec.key]!=='string')continue;
      const value=JSON.parse(locals[rec.key]);
      if(!value?.[rec.recordKey])continue;
      value[rec.recordKey].image=await blobDataUrl(await download(rec.path));
      locals[rec.key]=JSON.stringify(value);
    }
    say('Writing restored data into this browser...');
    for(const [db,store] of STORES)await writeStore(db,store,toWrite.get(db+'|'+store));
    for(const [key,value] of Object.entries(locals))localStorage.setItem(key,value);
    say('Restored! Reloading the map...');
    location.reload();
  });
})();
