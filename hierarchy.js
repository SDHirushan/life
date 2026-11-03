/* Life Quest • Week & Day Roads
   Extra layer — loads after app.js, custom-milestones.js, month-visions.js.
   Existing campaign, month images, and daily reviews remain untouched. */
(() => {
  'use strict';
  const by = id => document.getElementById(id);
  if (typeof chapters === 'undefined' || typeof switchMode !== 'function' || !by('map')) {
    console.warn('Life Quest base map must load before hierarchy.js');
    return;
  }
  const STORAGE = 'lifequest-hierarchy-v1';
  const PHOTO_DB = 'lifequest-hierarchy-photos-v1';
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const WD = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const WD_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const pad = n => String(n).padStart(2,'0');
  const dateKey = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const localDate = (y,m,d) => new Date(y,m,d,12);
  const addDays = (d,n) => localDate(d.getFullYear(),d.getMonth(),d.getDate()+n);
  const inMonth = (d,y,m) => d.getFullYear() === y && d.getMonth() === m;
  const dateCaption = d => `${pad(d.getDate())} ${MONTHS[d.getMonth()].slice(0,3)}`;
  const calendarLink = d => `https://calendar.google.com/calendar/u/0/r/day/${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;
  const monthLink = (y,m) => `https://calendar.google.com/calendar/r/month/${y}/${pad(m+1)}/01`;
  let state = {};
  try { const s=JSON.parse(localStorage.getItem(STORAGE)||'{}'); if(s && typeof s === 'object' && !Array.isArray(s)) state=s; } catch(e) { console.warn('Hierarchy data cannot load',e); }
  const save = () => { try { localStorage.setItem(STORAGE,JSON.stringify(state)); by('hq-save').textContent='Saved in this browser ✓'; return true; } catch(e) { by('hq-save').textContent='Storage full — change not saved. Back up your data.'; console.error(e); return false; } };
  function entry(key) {
    if (!state[key]) state[key]={title:'',description:'',notes:'',done:false,tasks:[],milestones:[]};
    if (!Array.isArray(state[key].tasks)) state[key].tasks=[];
    if (!Array.isArray(state[key].milestones)) state[key].milestones=[];
    return state[key];
  }
  const overlay=document.createElement('section');
  overlay.className='hq-overlay'; overlay.id='hq-overlay'; overlay.hidden=true;
  overlay.setAttribute('aria-label','Life Quest weekly and daily maps');
  overlay.innerHTML=`
    <div class="hq-header">
      <div class="hq-brand"><span>✧ LIFE QUEST</span><small id="hq-path">WEEK ROAD</small></div>
      <div class="hq-crumbs" id="hq-crumbs"></div>
      <button id="hq-back" type="button">← Back</button>
      <button id="hq-exit" type="button">✕ Close</button>
    </div>
    <div class="hq-layout">
      <aside class="hq-sidebar">
        <span class="hq-kicker">YOUR JOURNEY</span>
        <h2 id="hq-side-title">The next chapter</h2>
        <p id="hq-side-sub"></p>
        <div class="hq-progress"><div id="hq-progress-bar"></div></div>
        <div id="hq-progress-label" class="hq-sublabel"></div>
        <nav id="hq-list" aria-label="Choose week or day"></nav>
        <button id="hq-month-vision" type="button">📷 Month photo + Google Calendar</button>
      </aside>
      <div class="hq-map-wrap">
        <canvas id="hq-canvas" aria-label="Winding road with clickable weekly or daily milestones" tabindex="0"></canvas>
        <div class="hq-map-hud"><strong id="hq-map-title"></strong><span>Drag to explore · Tap a landmark</span></div>
        <button class="hq-overview" id="hq-overview" type="button">⌖ World view</button>
        <div class="hq-map-hint" id="hq-map-hint">Tap a landmark to continue your journey</div>
      </div>
      <aside class="hq-panel" id="hq-panel">
        <span class="hq-kicker" id="hq-level">WEEKLY MISSION</span>
        <h2 id="hq-heading"></h2><div id="hq-range" class="hq-range"></div>
        <label for="hq-title">My milestone title</label><input id="hq-title" maxlength="100" placeholder="Name your milestone">
        <label for="hq-desc">My main objective</label><textarea id="hq-desc" rows="3" placeholder="Describe the outcome I am working toward..."></textarea>
        <div class="hq-section-head"><strong>My quests</strong><span>Tick as you complete</span></div>
        <div id="hq-tasks"></div>
        <div class="hq-addrow"><input id="hq-new-task" maxlength="160" placeholder="Add a personal quest"><button id="hq-add-task" type="button">＋</button></div>
        <div class="hq-section-head"><strong>Extra milestones</strong><span>More dreams for this stop</span></div>
        <div id="hq-goals"></div><button id="hq-add-goal" type="button" class="hq-minor">＋ Add milestone</button>
        <label for="hq-notes">Field notes</label><textarea id="hq-notes" rows="4" placeholder="Ideas, reflection and plans..."></textarea>
        <div class="hq-photoarea"><strong>Vision picture</strong><img id="hq-photo" alt="Vision for this milestone" hidden><input id="hq-upload" type="file" accept="image/*" hidden>
          <div class="hq-photo-actions"><button id="hq-upload-btn" type="button">📷 Add / change photo</button><button id="hq-photo-view" type="button" hidden>View full image</button><button id="hq-photo-delete" type="button" hidden>🗑 Delete photo</button></div>
        </div>
        <a id="hq-calendar" target="_blank" rel="noopener noreferrer" class="hq-calendar">📅 Open Google Calendar ↗</a>
        <button id="hq-journal" type="button" class="hq-minor" hidden>📔 Write Daily Review</button>
        <button id="hq-advance" type="button" class="hq-advance">Explore days →</button>
        <button id="hq-done" type="button" class="hq-done">⚑ Mark achieved</button>
        <p id="hq-save" role="status" class="hq-sublabel">Changes save in this browser</p>
      </aside>
    </div>
    <dialog class="hq-picture-dialog" id="hq-picture-dialog"><button id="hq-picture-close" type="button">✕ Close</button><img id="hq-picture-full" alt="Full-size milestone image"></dialog>
    <dialog class="hq-goal-dialog" id="hq-goal-dialog"><form method="dialog" id="hq-goal-form">
      <h2 id="hq-goal-heading">Add milestone</h2><label for="hq-goal-title">Milestone name</label><input id="hq-goal-title" maxlength="100" required placeholder="What am I achieving?">
      <label for="hq-goal-desc">Description</label><textarea id="hq-goal-desc" rows="4" placeholder="What does completing this look like?"></textarea>
      <label for="hq-goal-file">Dream image (optional)</label><img id="hq-goal-preview" class="hq-goal-preview" alt="Milestone vision picture" hidden><button id="hq-goal-image-view" type="button" hidden>View full picture</button><button id="hq-goal-image-delete" type="button" hidden>🗑 Delete goal photo</button><input id="hq-goal-file" type="file" accept="image/*">
      <div class="hq-goal-actions"><button type="button" id="hq-goal-cancel">Cancel</button><button type="submit" id="hq-goal-save">Save milestone</button></div>
    </form></dialog>
  `;
  document.body.appendChild(overlay);
  const get = id => overlay.querySelector('#'+id);
  const c=get('hq-canvas'), g=c.getContext('2d');
  let level='weeks', yr=2026, mo=0, week=null, nodes=[], selected=0;
  let cw=0,ch=0,dpr=1,zoom=1,hqCamY=0,dragging=false,dragMoved=0,lastPointer=null;
  let currentPictureURL=null, currentGoalPictureURL=null, photoToken=0, goalEditing=null;
  function photoOp(mode,key,blob) {
    return new Promise((resolve,reject)=>{
      const open=indexedDB.open(PHOTO_DB,1);
      open.onupgradeneeded=()=>{if(!open.result.objectStoreNames.contains('photos'))open.result.createObjectStore('photos');};
      open.onerror=()=>reject(open.error);
      open.onsuccess=()=>{
        const db=open.result;const tx=db.transaction('photos',mode==='get'?'readonly':'readwrite');
        const store=tx.objectStore('photos');const req=mode==='get'?store.get(key):mode==='delete'?store.delete(key):store.put(blob,key);
        let result; req.onsuccess=()=>result=req.result;
        tx.oncomplete=()=>{db.close();resolve(result);};
        tx.onerror=()=>{db.close();reject(tx.error);};
        tx.onabort=()=>{db.close();reject(tx.error);};
      };
    });
  }
  function getWeeks(year,month) {
    const first=localDate(year,month,1),last=localDate(year,month+1,0);
    const start=addDays(first,-((first.getDay()+6)%7));
    const a=[];let n=1;
    for(let d=start;d<=last;d=addDays(d,7)) {
      const end=addDays(d,6),visibleStart=d<first?first:d,visibleEnd=end>last?last:end;
      const key=`week:${year}-${pad(month+1)}-${pad(n)}`;
      const legacy=getWeekStorage(year,month,n);
      const data=entry(key);
      // Show previously saved weekly quests the first time a week is opened.
      if(!data.importedLegacy) {
        if(!data.tasks.length && Array.isArray(legacy.tasks)) data.tasks=legacy.tasks.map(x=>({text:x.text||'',done:!!x.done}));
        if(!data.notes && legacy.notes) data.notes=legacy.notes;
        data.importedLegacy=true; save();
      }
      a.push({id:key,number:n,label:`Week ${pad(n)}`,subtitle:`${dateCaption(visibleStart)} – ${dateCaption(visibleEnd)}`,start:new Date(d),end,visibleStart,visibleEnd,calendar:calendarLink(visibleStart)});
      n++;
    }
    return a;
  }
  function getDays(w) {
    let days=[];
    for(let n=0;n<7;n++) {
      const d=addDays(w.start,n);
      if(inMonth(d,yr,mo)) days.push({id:`day:${dateKey(d)}`,number:d.getDate(),label:WD[d.getDay()],subtitle:`${dateCaption(d)} · ${WD_SHORT[d.getDay()]}`,date:d,calendar:calendarLink(d)});
    }
    return days;
  }
  function openWeeks(year,month) {
    year=Number(year);month=Number(month);
    if(!Number.isInteger(year)||year<1900||year>2200||!Number.isInteger(month)||month<0||month>11)return;
    yr=year;mo=month;week=null;level='weeks';nodes=getWeeks(yr,mo);
    const today=new Date();const idx=nodes.findIndex(w=>today>=w.start && today<=w.end && inMonth(today,yr,mo));
    selected=Math.max(0,idx);
    overlay.hidden=false;document.body.classList.add('hq-active');
    refresh(true);
  }
  function openDays(year,month,weekNumber) {
    yr=Number(year);mo=Number(month); const found=getWeeks(yr,mo).find(w=>w.number===Number(weekNumber));
    if(!found)return;
    week=found;level='days';nodes=getDays(week);
    const today=dateKey(new Date());const idx=nodes.findIndex(d=>dateKey(d.date)===today);
    selected=Math.max(0,idx);
    overlay.hidden=false;document.body.classList.add('hq-active');
    refresh(true);
  }
  function close() {overlay.hidden=true;document.body.classList.remove('hq-active');revoke();}
  function back() {if(level==='days') openWeeks(yr,mo);else{close();if(currentMode!=='months')switchMode('months');}}
  function ensureYearOption(y) {
    const sel=by('year-select');
    if(![...sel.options].some(o=>Number(o.value)===y))sel.add(new Option(String(y),String(y)));
    sel.value=String(y);
  }
  function enterYear(y) {
    ensureYearOption(y);selectedYear=y;selectedMonthIdx=0;
    if(currentMode!=='months')switchMode('months');else selectMonthChapter(0,true);
  }
  window.LQHierarchy={openWeeks,openDays,enterYear,close};
  get('hq-exit').onclick=close;get('hq-back').onclick=back;
  function nodeData(){return entry(nodes[selected].id);}
  function nodeHeading(n){const e=entry(n.id);return e.title.trim()||n.label;}
  function completed(n){const e=entry(n.id);return !!e.done;}
  function progress(n){return entry(n.id).milestones.filter(m=>m.done).length;}
  function markerPosition(i) {return {x:[430,650,335,635,400,570,430][i%7],y:210+(nodes.length-1-i)*245};}
  function worldHeight(){return 420+(nodes.length-1)*245;}
  function panelNode() {
    const n=nodes[selected],d=nodeData();
    get('hq-heading').textContent=nodeHeading(n);
    get('hq-range').textContent=n.subtitle;
    get('hq-title').value=d.title||'';get('hq-desc').value=d.description||'';get('hq-notes').value=d.notes||'';
    get('hq-done').textContent=d.done?'✓ Achieved · click to undo':'⚑ Mark achieved';
    get('hq-level').textContent=level==='weeks'?'WEEKLY MISSION':'DAILY MISSION';
    get('hq-advance').hidden=level==='days';get('hq-journal').hidden=level!=='days';
    get('hq-calendar').href=n.calendar;
    get('hq-save').textContent='Changes save in this browser';
    renderTasks();renderGoals();loadPhoto();
  }
  function renderTasks(){
    const box=get('hq-tasks');box.replaceChildren();
    const tasks=nodeData().tasks;
    if(!tasks.length){const p=document.createElement('p');p.className='hq-empty';p.textContent='Add your first quest for this milestone.';box.append(p);}
    tasks.forEach((task,i)=>{
      const row=document.createElement('div');row.className='hq-task';
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!task.done;cb.title='Mark complete';
      cb.onchange=()=>{task.done=cb.checked;save();renderSidebar();renderCanvas();};
      const name=document.createElement('input');name.type='text';name.value=task.text||'';name.maxLength=160;name.setAttribute('aria-label','Quest title');
      name.oninput=()=>{task.text=name.value;save();};
      const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Delete quest';
      del.onclick=()=>{tasks.splice(i,1);save();renderTasks();renderCanvas();};
      row.append(cb,name,del);box.append(row);
    });
  }
  function addTask(){const v=get('hq-new-task').value.trim();if(!v)return;nodeData().tasks.push({text:v,done:false});get('hq-new-task').value='';save();renderTasks();renderCanvas();}
  get('hq-add-task').onclick=addTask;get('hq-new-task').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addTask();}};
  function renderGoals(){
    const box=get('hq-goals');box.replaceChildren();
    nodeData().milestones.forEach((m,i)=>{
      const row=document.createElement('div');row.className='hq-goalrow';
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!m.done;cb.setAttribute('aria-label','Complete '+m.title);
      cb.onchange=()=>{m.done=cb.checked;save();renderSidebar();renderCanvas();};
      const name=document.createElement('button');name.type='button';name.className='hq-goallink';name.textContent=m.title;name.title='Edit milestone and picture';name.onclick=()=>openGoalEditor(i);
      const del=document.createElement('button');del.type='button';del.textContent='×';del.title='Delete milestone';
      del.onclick=async()=>{if(!confirm('Delete this milestone?'))return;nodeData().milestones.splice(i,1);save();renderGoals();renderSidebar();renderCanvas();try{await photoOp('delete',`goal:${m.id}`);}catch{}};
      row.append(cb,name,del);box.append(row);
    });
    if(!nodeData().milestones.length){let p=document.createElement('p');p.className='hq-empty';p.textContent='No extra milestones yet.';box.append(p);}
  }
  async function loadGoalPhoto(id) {
    if(currentGoalPictureURL) URL.revokeObjectURL(currentGoalPictureURL);
    currentGoalPictureURL=null;
    get('hq-goal-preview').hidden=true;get('hq-goal-preview').removeAttribute('src');
    get('hq-goal-image-view').hidden=true;get('hq-goal-image-delete').hidden=true;
    if(!id)return;
    try {const b=await photoOp('get',`goal:${id}`);
      if(!(b instanceof Blob)||!get('hq-goal-dialog').open)return;
      currentGoalPictureURL=URL.createObjectURL(b);
      get('hq-goal-preview').src=currentGoalPictureURL;get('hq-goal-preview').hidden=false;
      get('hq-goal-image-view').hidden=false;get('hq-goal-image-delete').hidden=false;
    }catch(e){console.warn('Goal picture could not load',e);}
  }
  get('hq-goal-image-delete').onclick=async()=>{
    const item=goalEditing===null?null:nodeData().milestones[goalEditing];
    if(!item||!confirm('Delete the image for this extra milestone?'))return;
    try {
      await photoOp('delete',`goal:${item.id}`);
      item.hasImage=false;save();await loadGoalPhoto(item.id);
    }catch(err){alert('Could not delete milestone image: '+err.message);}
  };
  get('hq-goal-image-view').onclick=()=>{
    if(!currentGoalPictureURL)return;
    get('hq-picture-full').src=currentGoalPictureURL;get('hq-picture-dialog').showModal();
  };
  get('hq-goal-dialog').addEventListener('close',()=>{
    if(currentGoalPictureURL)URL.revokeObjectURL(currentGoalPictureURL);currentGoalPictureURL=null;
  });
  function openGoalEditor(i=null){
    goalEditing=i;
    const item=i===null?null:nodeData().milestones[i];
    get('hq-goal-heading').textContent=item?'Edit milestone':'Add milestone';
    get('hq-goal-title').value=item?.title||'';get('hq-goal-desc').value=item?.description||'';
    get('hq-goal-file').value='';get('hq-goal-dialog').showModal();loadGoalPhoto(item?.id);
  }
  get('hq-add-goal').onclick=()=>openGoalEditor();
  get('hq-goal-cancel').onclick=()=>get('hq-goal-dialog').close();
  get('hq-goal-form').onsubmit=async e=>{
    e.preventDefault();
    const title=get('hq-goal-title').value.trim();if(!title)return;
    const goals=nodeData().milestones;
    const old=goalEditing===null?null:goals[goalEditing];
    const item={id:old?.id||`hqgoal-${Date.now()}-${Math.random().toString(36).slice(2)}`,title,description:get('hq-goal-desc').value.trim(),done:old?.done||false,hasImage:old?.hasImage||false};
    const f=get('hq-goal-file').files[0];
    try{
      if(f){if(!f.type.startsWith('image/'))throw new Error('Choose an image.');await photoOp('put',`goal:${item.id}`,f);item.hasImage=true;}
      if(goalEditing===null)goals.push(item);else goals[goalEditing]=item;
      save();renderGoals();renderSidebar();renderCanvas();get('hq-goal-dialog').close();
    }catch(err){alert('Could not save milestone: '+err.message);}
  };
  async function loadPhoto(){
    const token=++photoToken;revoke();const el=get('hq-photo');el.hidden=true;el.removeAttribute('src');get('hq-photo-view').hidden=true;get('hq-photo-delete').hidden=true;
    try{
      const file=await photoOp('get',nodes[selected].id);
      if(token!==photoToken||overlay.hidden)return;
      if(file instanceof Blob){currentPictureURL=URL.createObjectURL(file);el.src=currentPictureURL;el.hidden=false;get('hq-photo-view').hidden=false;get('hq-photo-delete').hidden=false;}
    }catch(e){console.warn('Photo unavailable',e);}
  }
  function revoke(){if(currentPictureURL)URL.revokeObjectURL(currentPictureURL);currentPictureURL=null;}
  get('hq-upload-btn').onclick=()=>get('hq-upload').click();
  get('hq-upload').onchange=async e=>{
    const f=e.target.files[0];e.target.value='';if(!f)return;
    if(!f.type.startsWith('image/')){alert('Please choose an image.');return;}
    const key=nodes[selected].id;
    try{await photoOp('put',key,f);if(nodes[selected].id===key)await loadPhoto();get('hq-save').textContent='Full-quality picture saved ✓';}
    catch(err){get('hq-save').textContent='Could not save photo. Browser storage may be full.';console.warn(err);}
  };
  get('hq-photo-delete').onclick=async()=>{
    const key=nodes[selected]?.id;
    if(!key||!confirm('Delete the photo for this week/day?'))return;
    try {
      await photoOp('delete',key);
      await loadPhoto();
      if(get('hq-picture-dialog').open)get('hq-picture-dialog').close();
      get('hq-save').textContent='Photo deleted ✓';
    }catch(err){get('hq-save').textContent='Photo deletion failed: '+err.message;}
  };
  get('hq-photo-view').onclick=()=>{if(!currentPictureURL)return;get('hq-picture-full').src=currentPictureURL;get('hq-picture-dialog').showModal();};
  get('hq-picture-close').onclick=()=>get('hq-picture-dialog').close();
  get('hq-picture-dialog').onclick=e=>{if(e.target===get('hq-picture-dialog'))get('hq-picture-dialog').close();};
  for (const [input,field] of [['hq-title','title'],['hq-desc','description'],['hq-notes','notes']]){
    get(input).addEventListener('input',()=>{nodeData()[field]=get(input).value;save();if(field==='title'){get('hq-heading').textContent=nodeHeading(nodes[selected]);renderSidebar();renderCanvas();}});
  }
  get('hq-done').onclick=()=>{nodeData().done=!nodeData().done;save();panelNode();renderSidebar();renderCanvas();};
  get('hq-advance').onclick=()=>{if(level==='weeks')openDays(yr,mo,nodes[selected].number);};
  get('hq-journal').onclick=()=>{
    if(level!=='days')return;const d=nodes[selected].date;
    by('review-open').click();by('review-date').value=dateKey(d);by('review-date').dispatchEvent(new Event('change'));
  };
  get('hq-month-vision').onclick=()=>{if(window.LQMonthVisions?.openMonth)window.LQMonthVisions.openMonth(yr,mo);else window.open(monthLink(yr,mo),'_blank','noopener');};
  // Context controls: Return to the exact parent on every level.
  function breadcrumbs(){
    const dest=get('hq-crumbs');dest.replaceChildren();
    const mk=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;dest.append(b);};
    mk('Years',()=>{close();switchMode('years');});
    mk(`${yr} months`,()=>{close();enterYear(yr);});
    if(level==='days')mk(`${MONTHS[mo]} weeks`,()=>openWeeks(yr,mo));
    const last=document.createElement('strong');last.textContent=level==='weeks'?`${MONTHS[mo]} weeks`:`${week.label} · days`;dest.append(last);
  }
  function refresh(resetCamera){
    get('hq-path').textContent=level==='weeks'?'THE WEEK ROAD':'THE DAY ROAD';
    get('hq-side-title').textContent=level==='weeks'?`${MONTHS[mo]} ${yr}`:`${MONTHS[mo]} · ${week.label}`;
    get('hq-side-sub').textContent=level==='weeks'?'Choose a week to travel into its days.':'Choose a day to track your progress and dreams.';
    get('hq-map-title').textContent=level==='weeks'?'THE WEEKLY TRAIL':'THE DAILY PATH';
    get('hq-map-hint').textContent=level==='weeks'?'Tap a week landmark to explore its days':'Tap a day landmark to plan it';
    breadcrumbs();renderSidebar();panelNode();resizeCanvas();
    if(resetCamera){hqCamY=markerPosition(selected).y;renderCanvas();}
  }
  function renderSidebar(){
    const box=get('hq-list');box.replaceChildren();
    let done=0;
    nodes.forEach((n,i)=>{
      if(completed(n))done++;
      const b=document.createElement('button');b.type='button';b.className='hq-stop'+(i===selected?' active':'');
      const num=document.createElement('span');num.className='hq-number';num.textContent=completed(n)?'✓':String(i+1).padStart(2,'0');
      const content=document.createElement('span');const title=document.createElement('strong');title.textContent=nodeHeading(n);
      const sub=document.createElement('small');sub.textContent=n.subtitle+' · '+progress(n)+' extra done';content.append(title,sub);b.append(num,content);
      b.onclick=()=>{selected=i;if(level==='weeks')openDays(yr,mo,n.number);else chooseDay(i);};
      // A separate editor button means you can add a photo to ANY week,
      // without the normal week click immediately navigating into its days.
      const row=document.createElement('div');row.className='hq-nav-row';row.append(b);
      const edit=document.createElement('button');edit.type='button';edit.className='hq-stop-edit';
      edit.textContent='✎';edit.title='Edit '+n.label+' goals and photo';
      edit.setAttribute('aria-label','Edit '+n.label+' goals and photo');
      edit.onclick=()=>{
        if(level==='weeks'){
          selected=i;panelNode();renderSidebar();renderCanvas();
        } else {chooseDay(i);}
        document.getElementById('hq-edit-stop')?.click();
      };
      row.append(edit);box.append(row);
    });
    get('hq-progress-bar').style.width=(nodes.length?done/nodes.length*100:0)+'%';
    get('hq-progress-label').textContent=`${done} / ${nodes.length} milestones achieved`;
  }
  function chooseDay(i){selected=i;hqCamY=markerPosition(i).y;panelNode();renderSidebar();renderCanvas();}
  function resizeCanvas(){
    const rect=c.getBoundingClientRect();cw=rect.width;ch=rect.height;
    if(!cw||!ch)return;dpr=Math.min(2,window.devicePixelRatio||1);
    c.width=Math.round(cw*dpr);c.height=Math.round(ch*dpr);
    g.setTransform(dpr,0,0,dpr,0,0);zoom=Math.min(1.1,Math.max(.56,cw/880));renderCanvas();
  }
  function toScreen(x,y){return {x:cw/2+(x-480)*zoom,y:ch/2+(y-hqCamY)*zoom};}
  function toWorld(x,y){return {x:480+(x-cw/2)/zoom,y:hqCamY+(y-ch/2)/zoom};}
  function clampCam(){const m=ch/(2*zoom);hqCamY=ch/zoom>=worldHeight()?worldHeight()/2:Math.max(m,Math.min(worldHeight()-m,hqCamY));}
  function hill(x,y,s,color){g.fillStyle=color;g.beginPath();g.moveTo(x-s,y+s*.8);g.lineTo(x,y-s);g.lineTo(x+s,y+s*.8);g.closePath();g.fill();}
  function drawTree(x,y,s){g.fillStyle='#102f25aa';g.beginPath();g.ellipse(x+4,y+s*.72,s*.48,s*.24,0,0,Math.PI*2);g.fill();g.fillStyle='#765b35';g.fillRect(x-s*.09,y+s*.12,s*.18,s*.7);hill(x,y-s*.20,s*.60,'#335b44');hill(x,y-s*.40,s*.47,'#426e53');}
  function building(x,y,style=0){
    const top=y-42;
    g.fillStyle='#c7b574';g.fillRect(x-30,top,60,57);
    g.fillStyle='#718d79';g.beginPath();g.moveTo(x-46,top);g.lineTo(x,top-36);g.lineTo(x+46,top);g.closePath();g.fill();
    g.fillStyle='#f1d18b';for(let k=-20;k<=20;k+=20)for(let r=0;r<2;r++)g.fillRect(x+k,top+10+r*20,9,12);
    g.fillStyle='#4a6658';g.fillRect(x-8,top+38,16,19);
  }
  function renderCanvas(){
    if(overlay.hidden||!cw||!ch)return;
    g.clearRect(0,0,cw,ch);g.fillStyle='#224235';g.fillRect(0,0,cw,ch);
    const top=Math.max(0,hqCamY-ch/(2*zoom)-100),bottom=Math.min(worldHeight(),hqCamY+ch/(2*zoom)+100);
    // Deterministic woods, clear winding road and labels.
    for(let i=0;i<600;i++){
      let x=((i*173+107)%920)+20,y=((i*281+37)%Math.ceil(worldHeight()));
      if(y<top||y>bottom)continue;
      if(nodes.some((n,j)=>{const p=markerPosition(j);return Math.abs(p.y-y)<100&&Math.abs(p.x-x)<120;}))continue;
      if(Math.abs(x-(480+Math.sin(y/180)*130))<95)continue;
      const p=toScreen(x,y);drawTree(p.x,p.y,(12+i%5*3)*zoom);
    }
    const ordered=nodes.map((n,i)=>markerPosition(i));
    function path(){g.beginPath();ordered.forEach((p,i)=>{const s=toScreen(p.x,p.y);if(i===0)g.moveTo(s.x,s.y);else {const prev=toScreen(ordered[i-1].x,ordered[i-1].y);g.bezierCurveTo(prev.x,prev.y-85*zoom,s.x,s.y+85*zoom,s.x,s.y);}});}
    if(ordered.length>1){g.lineCap='round';g.lineJoin='round';path();g.strokeStyle='#09271d';g.lineWidth=58*zoom;g.stroke();path();g.strokeStyle='#8e9164';g.lineWidth=43*zoom;g.stroke();path();g.strokeStyle='#b5ac78';g.lineWidth=31*zoom;g.stroke();}
    nodes.forEach((node,i)=>{
      const p=markerPosition(i),s=toScreen(p.x,p.y);
      if(s.y < -125||s.y > ch+150)return;
      const chosen=i===selected;
      g.fillStyle='#112e22c9';g.beginPath();g.ellipse(s.x,s.y+17*zoom,92*zoom,45*zoom,0,0,Math.PI*2);g.fill();
      g.fillStyle=chosen?'#8f9460':'#657b55';g.beginPath();g.ellipse(s.x,s.y+5*zoom,88*zoom,43*zoom,0,0,Math.PI*2);g.fill();
      building(s.x,s.y, i%3);
      g.textAlign='center';g.font=`bold ${Math.max(12,13*zoom)}px Manrope, sans-serif`;
      g.fillStyle=completed(node)?'#b7efb6':'#efda9a';
      g.fillText(level==='weeks'?`W${i+1}`:WD_SHORT[node.date.getDay()],s.x,s.y-87*zoom);
      g.font=`600 ${Math.max(10,11*zoom)}px 'DM Sans',sans-serif`;g.fillStyle='#eff3db';
      const title=nodeHeading(node);g.fillText(title.length>21?title.slice(0,19)+'…':title,s.x,s.y+78*zoom);
      g.font=`${Math.max(9,10*zoom)}px 'DM Sans',sans-serif`;g.fillStyle='#c1d1bd';g.fillText(node.subtitle,s.x,s.y+94*zoom);
      const milestoneCount=entry(node.id).milestones.length;
      if(milestoneCount){g.fillStyle='#ecc77e';g.font=`bold ${Math.max(10,11*zoom)}px sans-serif`;g.fillText(`✦ ${milestoneCount} dreams`,s.x,s.y+111*zoom);}
      if(chosen){g.strokeStyle='#edd58f';g.lineWidth=2;g.beginPath();g.ellipse(s.x,s.y+5*zoom,96*zoom,49*zoom,0,0,Math.PI*2);g.stroke();}
    });
  }
  c.onpointerdown=e=>{dragging=true;dragMoved=0;lastPointer={x:e.clientX,y:e.clientY,originY:hqCamY};c.setPointerCapture(e.pointerId);};
  c.onpointermove=e=>{if(!dragging)return;const dy=e.clientY-lastPointer.y;dragMoved=Math.max(dragMoved,Math.hypot(e.clientX-lastPointer.x,dy));hqCamY=lastPointer.originY-dy/zoom;clampCam();renderCanvas();};
  c.onpointerup=e=>{if(!dragging)return;dragging=false;try{c.releasePointerCapture(e.pointerId);}catch{}
    if(dragMoved>9)return;const r=c.getBoundingClientRect(),p=toWorld(e.clientX-r.left,e.clientY-r.top);
    let candidate=-1,dist=1e9;nodes.forEach((n,i)=>{const pt=markerPosition(i);const d=Math.hypot(p.x-pt.x,(p.y-pt.y)*.85);if(d<dist){dist=d;candidate=i;}});
    if(candidate<0||dist>125)return;selected=candidate;
    if(level==='weeks')openDays(yr,mo,nodes[selected].number);else chooseDay(selected);
  };
  c.onpointercancel=()=>{dragging=false;};
  c.onwheel=e=>{e.preventDefault();hqCamY+=e.deltaY/zoom;clampCam();renderCanvas();};
  get('hq-overview').onclick=()=>{hqCamY=worldHeight()/2;zoom=Math.min(cw/1000,ch/worldHeight());renderCanvas();};
  // Restore useful zoom when a landmark is selected after overview.
  const ro=new ResizeObserver(()=>{if(!overlay.hidden)resizeCanvas();});ro.observe(c);
  // Link original Dream Mode to year map: you can keep the immersive image and explore further.
  const dreamControls=document.querySelector('.dream-controls');
  if(dreamControls&&!by('hq-dream-year')){
    const button=document.createElement('button');button.type='button';button.id='hq-dream-year';button.textContent='🗺 Explore this year';dreamControls.append(button);
    button.onclick=()=>{const year=chapters[typeof activeDreamIndex==='number'?activeDreamIndex:selectedYearIdx]?.year||selectedYear;by('dream-dialog').close();enterYear(year);};
  }
  // Preserve the original year-based image viewer and click handling.
  // On the 12-month canvas, click a month building -> week road;
  // click its week stone -> the real calendar day road.
  const previousPointerUp=canvas.onpointerup;
  canvas.onpointerup=function(ev){
    if(ev.type==='pointerup'&&isDragging&&dragDistance<=6){
      const r=canvas.getBoundingClientRect();const x=(ev.clientX-r.left-w/2)/scale+camX,y=(ev.clientY-r.top-h/2)/scale+camY;
      if(currentMode==='months'){
        const weekStone=weekStones.find(s=>Math.hypot(x-s.x,y-s.y)<20);
        const m=weekStone?weekStone.mIndex:monthChapters.findIndex(p=>Math.hypot(x-p.x,(y-p.y+15)*.8)<115);
        if(m>=0){try{canvas.releasePointerCapture(ev.pointerId);}catch{}isDragging=false;canvas.style.cursor='grab';
          if(weekStone)openDays(selectedYear,m,weekStone.weekNum);else{selectMonthChapter(m,true);openWeeks(selectedYear,m);}return;}
      }
    }
    return previousPointerUp.call(this,ev);
  };
  // Keep the current month's photo accessible from a dedicated button on the map.
  const toolbar=by('overview')?.parentElement;
  if(toolbar){const b=document.createElement('button');b.id='hq-photo-month';b.type='button';b.textContent='📷 Month Vision';b.title='Monthly photo and Google Calendar';
    toolbar.insertBefore(b,by('overview'));b.onclick=()=>{if(currentMode!=='months'){enterYear(chapters[selectedYearIdx]?.year||selectedYear);}window.LQMonthVisions?.openMonth(selectedYear,selectedMonthIdx);};
  }
  // Custom milestone years can also be entered, even beyond the default 2032.
  const customViewer=document.querySelector('.extra-vision .extra-actions');
  if(customViewer){const b=document.createElement('button');b.type='button';b.id='hq-custom-year';b.textContent='🗺 Explore this year';customViewer.append(b);
    b.onclick=()=>{const text=document.getElementById('extra-view-year')?.textContent;const y=Number(text);if(Number.isInteger(y)){document.querySelector('.extra-vision')?.close();enterYear(y);}};
  }
})();
