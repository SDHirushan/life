/* Life Quest — Monthly Vision Photos + Google Calendar
   Load AFTER app.js and custom-milestones.js (if used).
   Images live in IndexedDB, not localStorage; each year/month has its own photo.
*/
(() => {
  'use strict';

  if (typeof canvas === 'undefined' ||
      typeof monthMarkers === 'undefined' ||
      typeof monthChapters === 'undefined' ||
      typeof getMonthStorage !== 'function') {
    console.warn('Load month-visions.js after app.js');
    return;
  }

  const css = document.createElement('style');
  css.textContent = `
    .mv-dialog {position:fixed;inset:0;margin:0;padding:0;width:100vw;height:100dvh;
      max-width:none;max-height:none;border:0;border-radius:0;background:#0d1d16;color:white}
    .mv-dialog::backdrop {background:#000}
    .mv-scene {position:relative;width:100%;height:100%;overflow:hidden;
      background:radial-gradient(ellipse at center,#355745,#081711)}
    .mv-background {position:absolute;inset:-30px;width:calc(100% + 60px);
      height:calc(100% + 60px);object-fit:cover;filter:blur(22px) brightness(.45)}
    .mv-photo {position:absolute;inset:0;width:100%;height:100%;object-fit:contain}
    .mv-background[hidden],.mv-photo[hidden] {display:none}
    .mv-shade {position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(#000b,transparent 24%,transparent 50%,#000e)}
    .mv-top,.mv-bottom {position:absolute;left:0;right:0;z-index:1;
      padding:clamp(15px,3vw,32px)}
    .mv-top {top:0;display:flex;align-items:center;justify-content:space-between;gap:15px}
    .mv-top strong {font:700 13px 'DM Sans',sans-serif;letter-spacing:2px;color:#f4d78e}
    .mv-bottom {bottom:0;max-width:850px}
    .mv-bottom h2 {font:600 clamp(28px,5vw,56px) Manrope,sans-serif;margin:8px 0 12px}
    .mv-hint {font-size:13px;color:#e1e9db;max-width:560px;line-height:1.5}
    .mv-actions {display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;align-items:center}
    .mv-actions button,.mv-actions a,.mv-top button {
      display:inline-flex;justify-content:center;align-items:center;text-decoration:none;
      color:#fff;background:#0c231bdc;border:1px solid #a79870;
      border-radius:8px;padding:12px 15px;font:600 12px 'DM Sans',sans-serif;cursor:pointer}
    .mv-actions a {background:#e5c784;color:#17251b;border-color:#e5c784}
    .mv-actions a:hover {background:#f3db9b}
    .mv-gallery {display:flex;align-items:center;gap:12px;margin-top:14px}
    .mv-gallery[hidden] {display:none}
    .mv-gallery button {width:42px;height:42px;border-radius:50%;border:1px solid #a79870;
      background:#0c231bdc;color:#fff;font-size:22px;line-height:1;cursor:pointer}
    .mv-gallery button:hover {background:#1b3a2d}
    .mv-gallery span {font:600 12px 'DM Sans',sans-serif;color:#e5c784;min-width:60px;text-align:center}
    .mv-status {color:#e5c784;font-size:11px;min-height:18px;margin-top:12px}
    @media(max-width:540px) {
      .mv-actions button,.mv-actions a {font-size:11px;padding:10px}
      .mv-top strong {font-size:11px}
    }
  `;
  document.head.appendChild(css);

  const dialog = document.createElement('dialog');
  dialog.className = 'mv-dialog';
  dialog.setAttribute('aria-labelledby', 'mv-heading');
  dialog.innerHTML = `
    <div class="mv-scene">
      <img class="mv-background" alt="" hidden>
      <img class="mv-photo" alt="Monthly dream picture" hidden>
      <div class="mv-shade"></div>
      <div class="mv-top">
        <strong id="mv-year-label">MONTHLY VISION</strong>
        <button id="mv-close" type="button">✕ Close</button>
      </div>
      <div class="mv-bottom">
        <div style="color:#e5c784;letter-spacing:3px;font-size:11px">MY MONTHLY DREAM</div>
        <h2 id="mv-heading"></h2>
        <p class="mv-hint">Imagine how you want this month to look. Add your dream photo, or plan the month in Google Calendar.</p>
        <div class="mv-actions">
          <button id="mv-upload" type="button">📷 Add photos (up to 10)</button>
          <button id="mv-delete" type="button">🗑 Delete this photo</button>
          <input id="mv-file" type="file" accept="image/*" multiple hidden>
          <a id="mv-calendar" target="_blank" rel="noopener noreferrer">📅 Open Google Calendar ↗</a>
        </div>
        <div class="mv-gallery" id="mv-gallery" hidden>
          <button id="mv-photo-prev" type="button" aria-label="Previous photo">‹</button>
          <span id="mv-photo-count">1 / 1</span>
          <button id="mv-photo-next" type="button" aria-label="Next photo">›</button>
        </div>
        <p id="mv-status" class="mv-status" role="status"></p>
      </div>
    </div>`;
  document.body.appendChild(dialog);

  const photo = dialog.querySelector('.mv-photo');
  const backdrop = dialog.querySelector('.mv-background');
  const label = dialog.querySelector('#mv-year-label');
  const heading = dialog.querySelector('#mv-heading');
  const status = dialog.querySelector('#mv-status');
  const calendar = dialog.querySelector('#mv-calendar');
  const fileInput = dialog.querySelector('#mv-file');
  let chosenYear = null;
  let chosenMonth = null;
  let gallery = [];
  let photoIndex = 0;
  let loadID = 0;

  function imageKey(year, monthIndex) {
    return `${year}_${monthIndex}`;
  }

  function imageDB(mode, key, blob) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('lifequest-month-vision-images', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('images');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        let result;
        const transaction = db.transaction('images', mode === 'get' ? 'readonly' : 'readwrite');
        const store = transaction.objectStore('images');
        const action = mode === 'put' ? store.put(blob, key) :
          mode === 'delete' ? store.delete(key) : store.get(key);
        action.onsuccess = () => { result = action.result; };
        transaction.oncomplete = () => { db.close(); resolve(result); };
        transaction.onerror = () => { db.close(); reject(transaction.error); };
        transaction.onabort = () => { db.close(); reject(transaction.error); };
      };
    });
  }

  function releaseGallery() {
    if (gallery.length) lqReleaseGallery(gallery);
    gallery = [];
    photoIndex = 0;
  }

  function clearPhoto() {
    releaseGallery();
    photo.hidden = true;
    backdrop.hidden = true;
    photo.removeAttribute('src');
    backdrop.removeAttribute('src');
    const nav = dialog.querySelector('#mv-gallery');
    if (nav) nav.hidden = true;
  }

  function renderPhoto(src) {
    photo.src = src;
    backdrop.src = src;
    photo.hidden = false;
    backdrop.hidden = false;
  }

  function renderGallery() {
    const entry = gallery[photoIndex];
    const nav = dialog.querySelector('#mv-gallery');
    const count = dialog.querySelector('#mv-photo-count');
    const previous = dialog.querySelector('#mv-photo-prev');
    const next = dialog.querySelector('#mv-photo-next');

    if (!entry) {
      photo.hidden = true;
      backdrop.hidden = true;
      photo.removeAttribute('src');
      backdrop.removeAttribute('src');
      if (nav) nav.hidden = true;
      return;
    }

    renderPhoto(entry.src);

    if (nav) nav.hidden = false;
    if (count) count.textContent = `${photoIndex + 1} / ${gallery.length}`;
    if (previous) previous.hidden = gallery.length < 2;
    if (next) next.hidden = gallery.length < 2;
  }

  async function loadMonthGallery(year, monthIndex, preferredIndex = 0) {
    const token = ++loadID;
    releaseGallery();
    photo.hidden = true;
    backdrop.hidden = true;
    photo.removeAttribute('src');
    backdrop.removeAttribute('src');

    const key = imageKey(year, monthIndex);
    const entries = [];

    try {
      const blob = await imageDB('get', key);

      if (blob instanceof Blob) {
        entries.push({
          key,
          src: URL.createObjectURL(blob),
          legacy: false,
          primary: true
        });
      } else {
        // Show a picture previously uploaded in the existing 12-Month Road.
        const oldPhoto = getMonthStorage(year, monthIndex).image;
        if (oldPhoto) {
          entries.push({
            key: null,
            src: oldPhoto,
            legacy: true,
            primary: true
          });
        }
      }

      entries.push(...await lqGalleryExtras(
        'lifequest-month-vision-images',
        'images',
        `gallery:${key}:`
      ));
    } catch (error) {
      lqReleaseGallery(entries);
      throw error;
    }

    if (token !== loadID || !dialog.open ||
        year !== chosenYear || monthIndex !== chosenMonth) {
      lqReleaseGallery(entries);
      return;
    }

    gallery = entries;
    photoIndex = entries.length
      ? Math.max(0, Math.min(preferredIndex, entries.length - 1))
      : 0;

    renderGallery();

    if (!entries.length) {
      status.textContent = 'No photo yet. Add up to 10 photos for this month.';
    } else if (entries.length === 1) {
      status.textContent = '1 photo saved for this month.';
    } else {
      status.textContent = `${entries.length} photos saved for this month.`;
    }
  }

  async function openMonth(year, monthIndex) {
    chosenYear = Number(year);
    chosenMonth = Number(monthIndex);
    ++loadID;
    clearPhoto();
    const monthName = monthChapters[chosenMonth].name;
    label.textContent = `CHAPTER · ${chosenYear}`;
    heading.textContent = `${monthName} ${chosenYear}`;
    calendar.href = 'https://calendar.google.com/calendar/r/month/' +
      chosenYear + '/' + String(chosenMonth + 1).padStart(2, '0') + '/01';
    status.textContent = 'Loading photos…';
    if (!dialog.open) dialog.showModal();

    try {
      await loadMonthGallery(chosenYear, chosenMonth, 0);
    } catch (error) {
      if (chosenYear === Number(year) && chosenMonth === Number(monthIndex)) {
        status.textContent = 'Image storage is unavailable in this browser.';
        console.warn('Monthly vision image could not be loaded', error);
      }
    }
  }

  dialog.querySelector('#mv-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    ++loadID;
    clearPhoto();
  });
  dialog.querySelector('#mv-delete').addEventListener('click', async () => {
    const entry = gallery[photoIndex];

    if (!entry || chosenYear === null || chosenMonth === null) return;
    if (!confirm(`Delete this photo from ${monthChapters[chosenMonth].name} ${chosenYear}?`)) return;

    const y = chosenYear, m = chosenMonth, oldIndex = photoIndex;

    try {
      if (entry.legacy) {
        // Older 12-Month Road image stored in localStorage.
        const legacy = getMonthStorage(y, m);
        delete legacy.image;
        localStorage.setItem('lifequest-user-months-v1', JSON.stringify(savedAnnual));
      } else if (entry.key) {
        await imageDB('delete', entry.key);
      }

      if (chosenYear === y && chosenMonth === m) {
        await loadMonthGallery(y, m, Math.max(0, oldIndex - 1));
        status.textContent = 'Photo deleted.';
      }
    } catch (error) { status.textContent = 'Could not delete photo: ' + error.message; }
  });

  dialog.querySelector('#mv-upload').addEventListener('click', () => fileInput.click());

  dialog.querySelector('#mv-photo-prev').addEventListener('click', () => {
    if (gallery.length < 2) return;
    photoIndex = (photoIndex - 1 + gallery.length) % gallery.length;
    renderGallery();
  });

  dialog.querySelector('#mv-photo-next').addEventListener('click', () => {
    if (gallery.length < 2) return;
    photoIndex = (photoIndex + 1) % gallery.length;
    renderGallery();
  });

  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files || []);
    fileInput.value = '';
    if (!files.length) return;

    const accepted = files.filter(file =>
      ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'].includes(file.type)
    );

    if (!accepted.length) {
      status.textContent = 'Please choose a JPG, PNG, WebP, AVIF or GIF image.';
      return;
    }

    const year = chosenYear;
    const monthIndex = chosenMonth;
    const key = imageKey(year, monthIndex);
    status.textContent = 'Saving photo(s)…';

    try {
      // New photos are added to the month gallery without replacing
      // the existing photo. Each file is compressed before storing.
      const result = await lqAddGalleryFiles(
        'lifequest-month-vision-images',
        'images',
        `gallery:${key}:`,
        accepted,
        gallery.length
      );

      if (!result.added) {
        status.textContent = 'No photos were added.';
        return;
      }

      if (year === chosenYear && monthIndex === chosenMonth && dialog.open) {
        await loadMonthGallery(year, monthIndex, gallery.length);
        status.textContent = `${result.added} photo(s) added.`;
      }
    } catch (error) {
      status.textContent = 'Could not save photo. Browser storage may be full or disabled.';
      console.warn('Monthly photo save failed', error);
    }
  });

  window.LQMonthVisions = { openMonth };

  // Wrap the original map handler so month taps open TWO options,
  // instead of automatically opening Google Calendar.
  const previousPointerUp = canvas.onpointerup;
  canvas.onpointerup = function(event) {
    if (event.type !== 'pointerup' || !isDragging || dragDistance > 6) {
      return previousPointerUp.call(this, event);
    }

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - w / 2) / scale + camX;
    const y = (event.clientY - rect.top - h / 2) / scale + camY;
    let year, monthIndex;

    if (currentMode === 'years') {
      const marker = monthMarkers.find(m => Math.hypot(x - m.x, y - m.y) < 22);
      if (!marker) return previousPointerUp.call(this, event);
      year = marker.year;
      monthIndex = marker.mIndex;
      // The year road leads to the 12-month world, not to a calendar tab.
      if (window.LQHierarchy?.enterYear) {
        try { canvas.releasePointerCapture(event.pointerId); } catch (error) {}
        isDragging = false;
        canvas.style.cursor = 'grab';
        window.LQHierarchy.enterYear(year);
        selectMonthChapter(monthIndex, !window.LQRoadmap?.unified);
        if (window.LQRoadmap?.unified) window.LQHierarchy.openWeeks(year, monthIndex);
        return;
      }

      player.x = marker.roadX;
      player.y = marker.roadY;
      targetCamX = marker.roadX;
      targetCamY = marker.roadY;
      clampCam();
      followingPlayer = true;
      updateViewButton();
    } else {
      // Weekly stepping stones should retain their usual behavior.
      if (weekStones.some(s => Math.hypot(x - s.x, y - s.y) < 20)) {
        return previousPointerUp.call(this, event);
      }
      const i = monthChapters.findIndex(c =>
        Math.hypot(x - c.x, (y - c.y + 15) * 0.8) < 115);
      if (i < 0) return previousPointerUp.call(this, event);
      selectMonthChapter(i, true);
      year = selectedYear;
      monthIndex = i;

      // A month landmark always leads into its calculated week hierarchy.
      // The Month Vision dialog is only opened by its dedicated buttons.
      if (window.LQHierarchy?.openWeeks) {
        try { canvas.releasePointerCapture(event.pointerId); } catch (error) {}
        isDragging = false;
        canvas.style.cursor = 'grab';
        window.LQHierarchy.openWeeks(year, monthIndex);
        return;
      }
    }

    try { canvas.releasePointerCapture(event.pointerId); } catch (error) {}
    isDragging = false;
    canvas.style.cursor = 'grab';
    // This fallback is kept only for installs without the hierarchy module.
    openMonth(year, monthIndex);
  };

  // Month buttons in the sidebar are dynamically regenerated by app.js.
  // Delegation keeps them working without changing renderNav().
  document.getElementById('chapters').addEventListener('click', event => {
    if (currentMode !== 'months') return;
    const button = event.target.closest('button.chapter');
    // The base app rebuilds sidebar buttons during onclick, so the clicked
    // node is detached before this delegated handler runs. Do not require
    // currentTarget.contains(button) here.
    if (!button) return;
    // Original button.onclick has already selected the correct month.
    if (window.LQHierarchy?.openWeeks) window.LQHierarchy.openWeeks(selectedYear, selectedMonthIdx);
    else openMonth(selectedYear, selectedMonthIdx);
  });
})();
