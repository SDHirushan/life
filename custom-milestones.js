/* Life Quest — chronological, expandable milestones.
   Load after app.js. All dreams share ONE continuous road, ordered by year. */
(() => {
  'use strict';

  if (typeof chapters === 'undefined' || !Array.isArray(chapters) ||
      !document.querySelector('.game') || !document.getElementById('chapters')) {
    console.warn('Life Quest must load before custom-milestones.js');
    return;
  }

  const KEY = 'lifequest-custom-milestones-v1';
  let items = [];
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (Array.isArray(stored)) items = stored;
  } catch (err) { console.warn('Custom milestone data could not load', err); }

  const style = document.createElement('style');
  style.textContent = `
    .extra-area{margin-top:10px;padding-top:10px}
    .extra-add{width:100%;background:#22392a;color:#e5c784;border-color:#776744;font-size:12px}
    .chapter.extra-item.active{background:#25362b;border-color:#e5c784}
    .chapter.extra-item .num{border-color:#718367}
    .extra-editor{width:min(92vw,480px);max-width:480px;max-height:88dvh;overflow:auto}
    .extra-editor h2{color:#e5c784;margin-top:0}
    .extra-editor label{display:block;margin:13px 0 5px;color:#e5c784;font-size:12px}
    .extra-editor input,.extra-editor select,.extra-editor textarea{
      width:100%;padding:11px;background:#0b1c14;color:#fff;
      border:1px solid #49654d;border-radius:7px;font:inherit}
    .extra-editor textarea{min-height:100px}
    .extra-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
    .extra-actions button{flex:1;min-width:110px}
    .extra-vision{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;
      max-height:none;margin:0;padding:0;border:0;border-radius:0;background:#0c1b14;color:#fff}
    .extra-vision-scene{position:relative;width:100%;height:100%;display:flex;
      flex-direction:column;justify-content:space-between;overflow:hidden;
      background:radial-gradient(circle,#3f5d47,#07150f)}
    .extra-vision-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .extra-vision-img[hidden]{display:none}
    .extra-vision-shade{position:absolute;inset:0;background:linear-gradient(#0008,transparent 35%,#000d)}
    .extra-vision-top,.extra-vision-bottom{position:relative;z-index:1;padding:clamp(18px,4vw,45px)}
    .extra-vision-top{display:flex;justify-content:space-between;align-items:center}
    .extra-vision-bottom{max-width:920px}
    .extra-vision-bottom h2{font-size:clamp(30px,6vw,68px);margin:8px 0}
    .extra-vision-bottom p{font-size:clamp(14px,2vw,20px);color:#eee;white-space:pre-wrap}
    .extra-vision .extra-actions{max-width:550px}
    .extra-vision .extra-actions button{background:#0b221bd9;border-color:#ab935e}
  `;
  document.head.appendChild(style);

  const sidebar = document.createElement('section');
  sidebar.className = 'extra-area';
  sidebar.innerHTML = '<button type="button" class="extra-add">＋ Add milestone</button>';
  const nav = document.getElementById('chapters');
  nav.after(sidebar);
  const navButtons = new Map();
  // Positions are in the original canvas's world coordinates. Custom milestones
  // are real illustrated destinations connected to the winding road.
  const positions = new Map();
  let activeCustomID = null;
  const originalDrawTerrain = drawTerrain;
  const originalPointerUp = canvas.onpointerup;
  const originalPointerMove = canvas.onpointermove;

  const editor = document.createElement('dialog');
  editor.className = 'extra-editor';
  editor.innerHTML = `
    <form id="extra-form">
      <h2 id="extra-form-heading">Add milestone</h2>
      <label for="extra-year">Year</label>
      <input id="extra-year" type="number" min="2026" max="2100" step="1" required>
      <label for="extra-type">Landmark appearance</label>
      <select id="extra-type">
        <option value="camp">Adventure camp</option>
        <option value="office">Company / skyscraper</option>
        <option value="academy">Skills academy</option>
        <option value="tower">Network tower</option>
        <option value="garage">Car / dream garage</option>
        <option value="palace">Mansion / palace</option>
        <option value="summit">Mountain summit</option>
      </select>
      <label for="extra-name">Name of your dream</label>
      <input id="extra-name" placeholder="e.g. Buy my first Lamborghini" maxlength="90" required>
      <label for="extra-description">Imagine your future (description)</label>
      <textarea id="extra-description" placeholder="Describe yourself living this dream..."></textarea>
      <label for="extra-photo">Vision photo (optional)</label>
      <input id="extra-photo" type="file" accept="image/*">
      <div class="extra-actions">
        <button type="button" id="extra-cancel">Cancel</button>
        <button type="submit">Save milestone</button>
      </div>
    </form>`;
  document.body.appendChild(editor);
  const form = editor.querySelector('form');
  const yearField = editor.querySelector('#extra-year');
  const typeField = editor.querySelector('#extra-type');
  const nameField = editor.querySelector('#extra-name');
  const descField = editor.querySelector('#extra-description');
  const photoField = editor.querySelector('#extra-photo');

  const viewer = document.createElement('dialog');
  viewer.className = 'extra-vision';
  viewer.innerHTML = `
    <div class="extra-vision-scene">
      <img class="extra-vision-img" alt="Vision of my future" hidden>
      <div class="extra-vision-shade"></div>
      <div class="extra-vision-top"><strong id="extra-view-year"></strong>
        <button type="button" id="extra-view-close">✕ Close</button></div>
      <div class="extra-vision-bottom"><span style="color:#e5c784;letter-spacing:3px">MY FUTURE LIFE</span>
        <h2 id="extra-view-title"></h2><p id="extra-view-desc"></p>
        <div class="extra-actions">
          <button type="button" id="extra-achieved">⚑ Mark achieved</button>
          <button type="button" id="extra-edit">✎ Edit</button>
          <button type="button" id="extra-remove-photo">🗑 Delete photo</button>
          <button type="button" id="extra-delete">Delete milestone</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(viewer);
  const visionImg = viewer.querySelector('.extra-vision-img');
  let photoURL = null;
  let editingID = null;
  let viewingID = null;

  // Store pictures separately from text so large images don't fill localStorage.
  function photoStore(mode, id, blob) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('lifequest-custom-photos', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('photos');
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('photos', mode === 'get' ? 'readonly' : 'readwrite');
        const store = tx.objectStore('photos');
        const op = mode === 'put' ? store.put(blob, id)
                 : mode === 'delete' ? store.delete(id) : store.get(id);
        op.onsuccess = () => resolve(op.result);
        op.onerror = () => reject(op.error);
        tx.oncomplete = () => db.close();
      };
    });
  }

  function imageAsJpeg(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) return reject(new Error('Choose an image file.'));
      const originalURL = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const ratio = Math.min(1, 1800 / Math.max(image.width, image.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(image.width * ratio));
        c.height = Math.max(1, Math.round(image.height * ratio));
        c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
        URL.revokeObjectURL(originalURL);
        c.toBlob(b => b ? resolve(b) : reject(new Error('Could not process image.')), 'image/jpeg', .82);
      };
      image.onerror = () => { URL.revokeObjectURL(originalURL); reject(new Error('Could not read image.')); };
      image.src = originalURL;
    });
  }

  function saveText(next) {
    localStorage.setItem(KEY, JSON.stringify(next));
    items = next;
    computePositions();
    renderItems();
  }

  function openEditor(item = null) {
    editingID = item ? item.id : null;
    form.reset();
    editor.querySelector('#extra-form-heading').textContent = item ? 'Edit milestone' : 'Add milestone';
    yearField.value = item ? String(item.year) : String(chapters[selectedYearIdx]?.year || chapters[0].year);
    nameField.value = item ? item.name : '';
    descField.value = item ? item.description : '';
    typeField.value = item ? (item.type || 'academy') : 'camp';
    editor.showModal();
    nameField.focus();
  }

  sidebar.querySelector('.extra-add').addEventListener('click', () => openEditor());
  editor.querySelector('#extra-cancel').addEventListener('click', () => editor.close());

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const id = editingID || `dream-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const oldItem = items.find(m => m.id === id);
    const item = { id, year: Number(yearField.value),
                   name: nameField.value.trim(), description: descField.value.trim(),
                   type: typeField.value,
                   done: Boolean(oldItem && oldItem.done),
                   hasPhoto: Boolean(oldItem && oldItem.hasPhoto) };
    if (!item.name) return;
    try {
      if (photoField.files[0]) {
        const blob = await imageAsJpeg(photoField.files[0]);
        await photoStore('put', id, blob);
        item.hasPhoto = true;
      }
      const next = editingID ? items.map(m => m.id === id ? item : m) : [...items, item];
      saveText(next);
      editor.close();
      openViewer(id);
    } catch (err) {
      alert('Milestone could not be saved: ' + err.message);
    }
  });

  // The original app redraws #chapters frequently, so reinsert custom milestones
  // after each redraw. Keep everything in one year-sorted list.
  function syncNavigation() {
    const nativeButtons = [...nav.children].filter(el =>
      el.classList.contains('chapter') && !el.classList.contains('extra-item')
    );

    if (currentMode !== 'years') {
      // The 12-Month Road retains its own monthly sidebar.
      if (nativeButtons.length !== nav.children.length) {
        nav.replaceChildren(...nativeButtons);
      }
      return;
    }

    // Wait until the original seven chapter buttons are available.
    if (nativeButtons.length !== chapters.length) return;

    const entries = nativeButtons.map((element, index) => ({
      element, year: Number(chapters[index].year), custom: 0, index
    }));

    items.forEach((item, index) => {
      const element = navButtons.get(item.id);
      if (element) {
        entries.push({ element, year: Number(item.year), custom: 1, index, id: item.id });
      }
    });

    entries.sort((a, b) =>
      a.year - b.year || a.custom - b.custom || a.index - b.index
    );

    // Match the original numbered-circle style for every milestone.
    entries.forEach((entry, number) => {
      const circle = entry.element.querySelector('.num');
      if (!circle) return;
      const achieved = entry.custom
        ? Boolean(items.find(i => i.id === entry.id)?.done)
        : Boolean(yearData[entry.index]?.done);
      const label = achieved ? '✓' : String(number + 1).padStart(2, '0');
      if (circle.textContent !== label) circle.textContent = label;
    });
    const done = yearData.filter(d => d.done).length + items.filter(i => i.done).length;
    const total = chapters.length + items.length;
    document.getElementById('count').textContent = `${done} / ${total}`;
    document.getElementById('bar').style.width = (100 * done / total) + '%';

    const ordered = entries.map(entry => entry.element);
    if (ordered.length === nav.children.length &&
        ordered.every((element, index) => nav.children[index] === element)) {
      return;  // Prevent a MutationObserver redraw loop.
    }
    nav.replaceChildren(...ordered);
  }

  function renderItems() {
    navButtons.clear();

    items.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'chapter extra-item' + (item.id === activeCustomID ? ' active' : '');

      const symbol = document.createElement('span');
      symbol.className = 'num';
      symbol.textContent = item.done ? '✓' : '✦';

      const text = document.createElement('span');
      const year = document.createElement('small');
      year.textContent = String(item.year);
      const name = document.createElement('strong');
      name.textContent = item.name;
      text.append(year, name);
      button.append(symbol, text);
      button.addEventListener('click', () => openViewer(item.id));
      navButtons.set(item.id, button);
    });

    syncNavigation();
  }

  async function openViewer(id) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    viewingID = id;
    viewer.querySelector('#extra-view-year').textContent = item.year;
    viewer.querySelector('#extra-view-title').textContent = item.name;
    viewer.querySelector('#extra-view-desc').textContent = item.description || 'Imagine yourself living this dream.';
    viewer.querySelector('#extra-achieved').textContent = item.done
      ? '✓ Achieved · undo' : '⚑ Mark achieved';
    activeCustomID = id;
    navigateToCustom(item);
    renderItems();
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = null;
    visionImg.hidden = true;
    visionImg.removeAttribute('src');
    if (!viewer.open) viewer.showModal();
    try {
      const blob = await photoStore('get', id);
      if (viewingID !== id || !viewer.open || !blob) return;
      photoURL = URL.createObjectURL(blob);
      visionImg.src = photoURL;
      visionImg.hidden = false;
    } catch (err) { console.warn('Milestone photo unavailable', err); }
  }

  function closeViewer() {
    viewer.close();
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = null;
    viewingID = null;
    visionImg.removeAttribute('src');
  }
  viewer.querySelector('#extra-view-close').addEventListener('click', closeViewer);
  viewer.addEventListener('close', () => {
    if (photoURL) URL.revokeObjectURL(photoURL);
    photoURL = null;
    viewingID = null;
  });
  viewer.querySelector('#extra-achieved').addEventListener('click', () => {
    const item = items.find(i => i.id === viewingID);
    if (!item) return;
    const next = items.map(i => i.id === item.id ? { ...i, done: !i.done } : i);
    saveText(next);
    viewer.querySelector('#extra-achieved').textContent = !item.done
      ? '✓ Achieved · undo' : '⚑ Mark achieved';
  });
  viewer.querySelector('#extra-remove-photo').addEventListener('click', async () => {
    const id = viewingID;
    const item = items.find(m => m.id === id);
    if (!item || !confirm('Delete this dream photo? (Milestone will remain.)')) return;
    try {
      await photoStore('delete', id);
      saveText(items.map(m => m.id === id ? {...m, hasPhoto: false} : m));
      await openViewer(id);
    } catch(err) { alert('Could not delete photo: ' + err.message); }
  });
  viewer.querySelector('#extra-edit').addEventListener('click', () => {
    const item = items.find(i => i.id === viewingID);
    closeViewer();
    if (item) openEditor(item);
  });
  viewer.querySelector('#extra-delete').addEventListener('click', async () => {
    if (!confirm('Delete this dream milestone?')) return;
    const id = viewingID;
    try {
      saveText(items.filter(i => i.id !== id));
      await photoStore('delete', id);
      closeViewer();
    } catch (err) { alert('Could not delete milestone: ' + err.message); }
  });

  /*
   * A single chronological world road.
   * Original chapters and custom dreams are stops on ONE path.
   * Later years are always higher up the map. We never recycle the
   * 2031-2032 road segment for dates after 2032.
   */
  let campaignHeight = 2700;
  const columnPattern = [480, 720, 370, 690, 340, 670, 490];

  function computePositions() {
    positions.clear();

    // Preserve creation order for milestones sharing the same year.
    const orderedCustom = items.map((item, index) => ({item, index}));
    const allStops = [
      ...chapters.map((chapter, index) => ({
        year: Number(chapter.year), original: true, chapter, index
      })),
      ...orderedCustom.map(({item, index}) => ({
        year: Number(item.year), original: false, item, index
      }))
    ];

    // For a shared year: original chapter first, then custom dreams.
    allStops.sort((a, b) => a.year - b.year ||
      Number(b.original) - Number(a.original) || a.index - b.index);

    // Every additional milestone extends the entire road by one stop.
    campaignHeight = Math.max(2700, 540 + 360 * (allStops.length - 1));
    const lastIndex = allStops.length - 1;

    allStops.forEach((stop, index) => {
      const x = columnPattern[index % columnPattern.length];
      const y = 260 + (lastIndex - index) * 360;
      stop.x = x;
      stop.y = y;
      if (stop.original) {
        stop.chapter.x = x;
        stop.chapter.y = y;
      } else {
        positions.set(stop.item.id, {x, y});
      }
    });

    // Replace the original seven-stop path with a continuous path through
    // ALL milestones, including custom years, without changing its identity.
    yearPoints.splice(0, yearPoints.length, ...buildRoadPoints(allStops));

    // Reposition calendar month markers along the modified road between
    // each pair of original chapters. This also works when additional
    // milestones have been inserted between two original years.
    const updatedMarkers = [];
    for (let segment = 0; segment < chapters.length - 1; segment++) {
      const start = allStops.findIndex(s => s.original && s.index === segment);
      const end = allStops.findIndex(s => s.original && s.index === segment + 1);
      const section = buildRoadPoints(allStops.slice(start, end + 1));
      let total = 0;
      const samples = section.map((p, index) => {
        if (index) total += Math.hypot(p.x - section[index - 1].x, p.y - section[index - 1].y);
        return { x: p.x, y: p.y, distance: total };
      });

      const usable = Math.max(0, total - 65 - 75);
      for (let month = 0; month < 12; month++) {
        const goalDistance = 65 + usable * month / 11;
        let k = samples.findIndex(s => s.distance >= goalDistance);
        if (k < 1) k = 1;
        const a = samples[k - 1], b = samples[k];
        const length = b.distance - a.distance || 1;
        const f = Math.max(0, Math.min(1, (goalDistance - a.distance) / length));
        const px = a.x + (b.x - a.x) * f;
        const py = a.y + (b.y - a.y) * f;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const nx = -dy / d, ny = dx / d;
        updatedMarkers.push({
          seg: segment, mIndex: month, year: chapters[segment].year,
          name: MONTH_NAMES[month], fullName: MONTH_FULL[month],
          isQuarter: month % 3 === 0,
          x: Math.round(px + nx * 38), y: Math.round(py + ny * 38),
          roadX: Math.round(px), roadY: Math.round(py)
        });
      }
    }
    monthMarkers.splice(0, monthMarkers.length, ...updatedMarkers);

    // Rebuild the decorative forest to fill the enlarged map. A small
    // deterministic generator prevents trees from changing on every redraw.
    yearTrees.length = 0;
    yearRocks.length = 0;
    let state = 184;
    function random() {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    }
    const attempts = Math.min(13000, Math.round(1600 * campaignHeight / 2700));
    for (let i = 0; i < attempts; i++) {
      const x = random() * W;
      const y = random() * campaignHeight;
      // Only test nearby road points for much faster large-world generation.
      const nearRoad = yearPoints.some(p =>
        Math.abs(p.y - y) < 84 && Math.hypot(x - p.x, y - p.y) < 78);
      const nearStop = allStops.some(s =>
        Math.abs(s.y - y) < 130 && Math.hypot(x - s.x, y - s.y) < 140);
      if (!nearRoad && !nearStop) {
        yearTrees.push({x, y, s: 12 + random() * 19, t: random()});
      }
    }
    const rockCount = Math.min(1500, Math.round(120 * campaignHeight / 2700));
    for (let i = 0; i < rockCount; i++) {
      yearRocks.push({x: random() * W, y: random() * campaignHeight, s: 20 + random() * 50});
    }

    if (currentMode === 'years') {
      H = campaignHeight;
      // On initial load, follow the first original chapter, not the old
      // map coordinates. When editing, the viewer will navigate afterward.
      if (!activeCustomID || !positions.has(activeCustomID)) {
        const selected = chapters[selectedYearIdx] || chapters[0];
        player.x = selected.x;
        player.y = selected.y + 70;
        targetCamX = selected.x;
        targetCamY = selected.y;
        camX = targetCamX;
        camY = targetCamY;
      }
      clampCam();
    }
  }

  // Draw added milestones exactly like original landmarks. Their stops
  // already belong to yearPoints, so no side branches are needed.
  drawTerrain = function(now) {
    originalDrawTerrain(now);
    if (currentMode !== 'years') return;
    items.forEach((item, index) => {
      const p = positions.get(item.id);
      if (!p) return;
      drawLandmark(
        {x: p.x, y: p.y, type: item.type || 'academy'},
        index, activeCustomID === item.id, Boolean(item.done),
        String(item.year), item.name, Boolean(item.hasPhoto)
      );
    });
  };

  // Clicking the illustrated station behaves like the original landmarks.
  canvas.onpointerup = function(event) {
    let match = null;
    if (event.type === 'pointerup' && currentMode === 'years' &&
        isDragging && dragDistance <= 6) {
      const r = canvas.getBoundingClientRect();
      const x = (event.clientX - r.left - w / 2) / scale + camX;
      const y = (event.clientY - r.top - h / 2) / scale + camY;
      match = items.find(item => {
        const p = positions.get(item.id);
        return p && Math.hypot(x - p.x, (y - p.y + 15) * .8) < 90;
      });
    }
    originalPointerUp.call(this, event); // Preserve original drag/click behavior.
    if (match) openViewer(match.id);
  };

  canvas.onpointermove = function(event) {
    originalPointerMove.call(this, event);
    if (isDragging || currentMode !== 'years') return;
    const r = canvas.getBoundingClientRect();
    const x = (event.clientX - r.left - w / 2) / scale + camX;
    const y = (event.clientY - r.top - h / 2) / scale + camY;
    if (items.some(item => {
      const p = positions.get(item.id);
      return p && Math.hypot(x - p.x, (y - p.y + 15) * .8) < 90;
    })) canvas.style.cursor = 'pointer';
  };

  function navigateToCustom(item) {
    if (currentMode !== 'years') document.getElementById('switch-years').click();
    const p = positions.get(item.id);
    if (!p) return;
    worldView = false;
    followingPlayer = true;
    player.x = p.x;
    player.y = p.y + 70;
    targetCamX = p.x;
    targetCamY = p.y;
    clampCam();
    updateViewButton();
    document.getElementById('maptitle').textContent = item.name;
    document.getElementById('location').textContent = `${item.year} · ${item.name.toUpperCase()}`;
  }

  // The original switcher restores H=2700 when entering the campaign.
  // Override only that size; the 12-month world still uses its own H=3400.
  const originalSwitchMode = switchMode;
  switchMode = function(mode) {
    originalSwitchMode(mode);
    if (mode === 'years') {
      H = campaignHeight;
      clampCam();
    }
  };

  new MutationObserver(syncNavigation).observe(nav, { childList: true });

  computePositions();
  renderItems();
})();
