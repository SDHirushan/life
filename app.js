'use strict';
const ROADMAP_STORAGE = 'lifequest-user-roadmap-v1';
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
let storedRoadmap = { years: [] };
try {
  const value = JSON.parse(localStorage.getItem(ROADMAP_STORAGE) || '{}');
  if (Array.isArray(value.years)) storedRoadmap = value;
} catch {}
const storedYears = storedRoadmap.years
  .filter(record => record && record.chapter && record.data)
  .sort((a, b) => Number(a.chapter.year) - Number(b.chapter.year));
const chapters = storedYears.map(record => ({ ...record.chapter }));
const monthChapters = MONTH_FULL.map((name, mIndex) => ({
  mIndex, name, place: name, title: '', desc: '', tasks: [],
  x: 480 + Math.sin(mIndex * 1.35) * 300, y: 3100 - mIndex * 260, type: 'camp'
}));

const $ = id => document.getElementById(id);

// State management
let currentMode = 'years'; // 'years' | 'months'
let selectedYear = chapters[0]?.year || new Date().getFullYear();
let selectedYearIdx = 0;
let selectedMonthIdx = 0;
let selectedWeekNode = null; // null or { mIndex, weekNum }
let selectedRoadmapMonth = false;

function isYearTarget() {
  return currentMode === 'years' && !selectedRoadmapMonth;
}

let yearData = storedYears.map(record => ({
  tasks: [], notes: '', done: false, ...record.data
}));

function persistYearRoadmap() {
  try {
    localStorage.setItem(ROADMAP_STORAGE, JSON.stringify({
      years: chapters.map((chapter, index) => ({ chapter, data: yearData[index] }))
    }));
    $('save-note').textContent = 'Progress saves in this browser.';
  } catch {
    $('save-note').textContent = 'Storage unavailable — changes last for this visit.';
  }
}

let savedAnnual = {};
try { savedAnnual = JSON.parse(localStorage.getItem('lifequest-user-months-v1') || '{}'); } catch {}

let savedWeeks = {};
try { savedWeeks = JSON.parse(localStorage.getItem('lifequest-user-weeks-v1') || '{}'); } catch {}

function getMonthStorage(year, mIdx) {
  let key = `${year}_${mIdx}`;
  if (!savedAnnual[key]) {
    let c = monthChapters[mIdx];
    savedAnnual[key] = {
      tasks: [],
      notes: '',
      done: false
    };
  }
  return savedAnnual[key];
}

function getWeekStorage(year, mIdx, wNum) {
  let key = `${year}_${mIdx}_${wNum}`;
  if (!savedWeeks[key]) {
    savedWeeks[key] = {
      tasks: [],
      notes: '',
      done: false
    };
  }
  return savedWeeks[key];
}


function getYearChapterName(i) {
  return (yearData[i] && yearData[i].customName !== undefined && yearData[i].customName.trim()) ? yearData[i].customName : (chapters[i]?.name || '');
}
function getYearChapterTitle(i) {
  return (yearData[i] && yearData[i].customTitle !== undefined && yearData[i].customTitle.trim()) ? yearData[i].customTitle : (chapters[i]?.title || '');
}
function getYearChapterImage(i) {
  return (yearData[i] && yearData[i].image) || '';
}

// ========================================
// MULTIPLE PHOTO STORAGE FOR YEAR MILESTONES
// ========================================

const YEAR_PHOTO_DB = 'lifequest-hierarchy-photos-v1';
const YEAR_PHOTO_LIMIT = 10;

function hasYearChapterImage(i) {
  return Boolean(getYearChapterImage(i) || yearData[i]?.hasGalleryPhotos);
}

function yearPhotoPrefix(i) {
  return `year-gallery:${chapters[i].year}:`;
}

// ========================================
// SHARED PHOTO GALLERY HELPERS
// ========================================
// Every milestone stores its extra gallery photos in the same IndexedDB
// database it already used. Extra photos use a key prefix, so the original
// single photo (or primary key) keeps working exactly as before.

const LQ_GALLERY_LIMIT = 10;

function lqOpenPhotoStore(dbName, storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(storeName)) {
        request.result.createObjectStore(storeName);
      }
    };

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(storeName)) {
        db.close();
        reject(new Error('The Life Quest photo store is unavailable.'));
        return;
      }

      resolve(db);
    };
  });
}

// A small IndexedDB wrapper used by every gallery:
// mode = 'get' | 'put' | 'delete' | 'list'
function lqPhotoOp(dbName, storeName, mode, key, blob) {
  return lqOpenPhotoStore(dbName, storeName).then(db => {
    return new Promise((resolve, reject) => {
      const readOnly = mode === 'list' || mode === 'get';
      const tx = db.transaction(storeName, readOnly ? 'readonly' : 'readwrite');
      const store = tx.objectStore(storeName);
      let result;

      if (mode === 'list') {
        const range = IDBKeyRange.bound(key, key + '\uffff');
        const keysRequest = store.getAllKeys(range);
        const valuesRequest = store.getAll(range);
        let keys = [];
        let values = [];

        keysRequest.onsuccess = () => { keys = keysRequest.result || []; };
        valuesRequest.onsuccess = () => { values = valuesRequest.result || []; };

        tx.oncomplete = () => {
          db.close();
          resolve(
            keys.map((storedKey, index) => ({
              key: storedKey,
              blob: values[index]
            })).sort((a, b) =>
              String(a.key).localeCompare(String(b.key), undefined, { numeric: true })
            )
          );
        };
      } else {
        const req =
          mode === 'put' ? store.put(blob, key) :
          mode === 'delete' ? store.delete(key) :
          store.get(key);

        req.onsuccess = () => { result = req.result; };

        tx.oncomplete = () => {
          db.close();
          resolve(result);
        };
      }

      tx.onerror = () => {
        db.close();
        reject(tx.error || new Error('Photo storage failed.'));
      };

      tx.onabort = () => {
        db.close();
        reject(tx.error || new Error('Photo storage was cancelled.'));
      };
    });
  });
}

async function lqGalleryExtras(dbName, storeName, prefix) {
  const items = await lqPhotoOp(dbName, storeName, 'list', prefix);
  return items
    .filter(item => item.blob instanceof Blob)
    .map(item => ({
      key: item.key,
      src: URL.createObjectURL(item.blob),
      legacy: false
    }));
}

// Release temporary object URLs so the browser can free memory.
function lqReleaseGallery(gallery, keepSrc = null) {
  (gallery || []).forEach(item => {
    if (item.src && item.src !== keepSrc && item.src.startsWith('blob:')) {
      URL.revokeObjectURL(item.src);
    }
  });
}

// Add selected files without ever replacing existing photos.
// `occupied` = number of photos the milestone already has (including its
// original single photo). Returns how many were actually added.
async function lqAddGalleryFiles(dbName, storeName, prefix, files, occupied) {
  const selected = Array.from(files || [])
    .filter(file => file && file.type && file.type.startsWith('image/'));

  if (!selected.length) return { added: 0, skipped: 0 };

  const available = Math.max(0, LQ_GALLERY_LIMIT - occupied);

  if (!available) {
    alert(`This milestone already has the maximum of ${LQ_GALLERY_LIMIT} photos.`);
    return { added: 0, skipped: selected.length };
  }

  const filesToAdd = selected.slice(0, available);
  const blobs = [];

  for (const file of filesToAdd) {
    blobs.push(await compressImageToBlob(file));
  }

  const savedKeys = [];

  try {
    for (let index = 0; index < blobs.length; index++) {
      const key = prefix +
        `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;
      await lqPhotoOp(dbName, storeName, 'put', key, blobs[index]);
      savedKeys.push(key);
    }
  } catch (error) {
    for (const key of savedKeys) {
      try { await lqPhotoOp(dbName, storeName, 'delete', key); } catch {}
    }
    throw error;
  }

  if (selected.length > filesToAdd.length) {
    alert(`Added ${filesToAdd.length} photo(s). The limit is ${LQ_GALLERY_LIMIT} photos per milestone.`);
  }

  return { added: filesToAdd.length, skipped: selected.length - filesToAdd.length };
}

window.LQPhotos = {
  LIMIT: LQ_GALLERY_LIMIT,
  op: lqPhotoOp,
  extras: lqGalleryExtras,
  add: lqAddGalleryFiles,
  release: lqReleaseGallery,
  compress: compressImageToBlob
};

// Save and retrieve year milestone photos using IndexedDB
function yearPhotoOp(mode, key, blob) {
  return lqPhotoOp(YEAR_PHOTO_DB, 'photos', mode, key, blob);
}

// Load all photos belonging to one year milestone
async function readYearGallery(i) {
  const gallery = [];
  const legacyImage = getYearChapterImage(i);

  // Keep the existing single photo as the first photo
  if (legacyImage) {
    gallery.push({
      key: null,
      src: legacyImage,
      legacy: true
    });
  }

  const stored = await yearPhotoOp('list', yearPhotoPrefix(i));

  stored.forEach(item => {
    if (item.blob instanceof Blob) {
      gallery.push({
        key: item.key,
        src: URL.createObjectURL(item.blob),
        legacy: false
      });
    }
  });

  return gallery;
}

// Release temporary image URLs to avoid memory leaks
function releaseYearGallery(gallery, keepURL = null) {
  (gallery || []).forEach(item => {
    if (
      !item.legacy &&
      item.src &&
      item.src !== keepURL
    ) {
      URL.revokeObjectURL(item.src);
    }
  });
}

// Compress uploaded images before saving them
function compressImageToBlob(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Choose a valid image file.'));
      return;
    }

    const originalURL = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const ratio = Math.min(
        1,
        1800 / Math.max(image.width, image.height)
      );

      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      canvas.getContext('2d').drawImage(
        image, 0, 0, width, height
      );

      URL.revokeObjectURL(originalURL);

      canvas.toBlob(blob => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not process this image.'));
        }
      }, 'image/jpeg', 0.88);
    };

    image.onerror = () => {
      URL.revokeObjectURL(originalURL);
      reject(new Error('Could not read this image.'));
    };

    image.src = originalURL;
  });
}

async function addYearGalleryFiles(i, files) {
    const selected = Array.from(files || [])
        .filter(file => file && file.type.startsWith('image/'));

    if (!selected.length) return 0;

    const existing = await yearPhotoOp(
        'list',
        yearPhotoPrefix(i)
    );

    const legacyCount = getYearChapterImage(i) ? 1 : 0;

    const available = Math.max(
        0,
        YEAR_PHOTO_LIMIT - existing.length - legacyCount
    );

    if (!available) {
        alert(`This milestone already has the maximum of ${YEAR_PHOTO_LIMIT} photos.`);
        return 0;
    }

    const filesToAdd = selected.slice(0, available);
    const blobs = [];

    for (const file of filesToAdd) {
        blobs.push(await compressImageToBlob(file));
    }

    const savedKeys = [];

    try {
        for (let index = 0; index < blobs.length; index++) {
            const key = yearPhotoPrefix(i) +
                `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`;

            await yearPhotoOp('put', key, blobs[index]);
            savedKeys.push(key);
        }
    } catch (error) {
        for (const key of savedKeys) {
            try {
                await yearPhotoOp('delete', key);
            } catch {}
        }

        throw error;
    }

    yearData[i].hasGalleryPhotos = true;

    try {
        persistYearRoadmap();
    } catch (error) {
        console.warn('Gallery photos saved, but the map indicator could not be updated.', error);
    }

    if (selected.length > filesToAdd.length) {
        alert(`Added ${filesToAdd.length} photo(s). The limit is ${YEAR_PHOTO_LIMIT} photos per milestone.`);
    }

    if (currentMode === 'years' && selectedYearIdx === i) {
        selectYearChapter(i);
    }

    return filesToAdd.length;
}


async function deleteYearGalleryEntry(i, entry) {
    if (entry.legacy) {
        delete yearData[i].image;
    } else {
        await yearPhotoOp('delete', entry.key);
    }

    const remaining = await yearPhotoOp(
        'list',
        yearPhotoPrefix(i)
    );

    yearData[i].hasGalleryPhotos = Boolean(
        getYearChapterImage(i) || remaining.length
    );

    try {
        persistYearRoadmap();
    } catch (error) {
        console.warn('Photo removed, but the gallery indicator could not be updated.', error);
    }

    if (currentMode === 'years' && selectedYearIdx === i) {
        selectYearChapter(i);
    }
}

// ========================================
// MAIN YEAR MILESTONE PHOTO GALLERY
// ========================================

let mainPointGallery = [];
let mainPointPhotoIndex = 0;
let mainPointGalleryToken = 0;
let mainPointGallerySpec = null;

function lqPad2(n) {
    return String(n).padStart(2, '0');
}

function releaseMainPointGallery(gallery) {
    lqReleaseGallery(gallery);
}

// Describes where the currently selected milestone keeps its photos.
// The original single photo stays the first gallery item.
function currentPointGallerySpec() {
    if (isYearTarget()) {
        const i = selectedYearIdx;
        return {
            db: YEAR_PHOTO_DB,
            store: 'photos',
            prefix: yearPhotoPrefix(i),
            primaryKey: null,
            legacySrc: getYearChapterImage(i),
            isYear: true,
            clearLegacy: () => { delete yearData[i].image; },
            saveLegacy: () => {
                try { persistYearRoadmap(); } catch {}
            }
        };
    }

    if (selectedWeekNode) {
        const w = selectedWeekNode;
        const id = `week:${selectedYear}-${lqPad2(w.mIndex + 1)}-${lqPad2(w.weekNum)}`;
        const wData = getWeekStorage(selectedYear, w.mIndex, w.weekNum);
        return {
            db: YEAR_PHOTO_DB,
            store: 'photos',
            prefix: `gallery:${id}:`,
            primaryKey: id,
            legacySrc: wData.image || '',
            isWeek: true,
            clearLegacy: () => { delete wData.image; },
            saveLegacy: () => {
                try {
                    localStorage.setItem('lifequest-user-weeks-v1', JSON.stringify(savedWeeks));
                } catch {}
            }
        };
    }

    const y = selectedYear;
    const m = selectedMonthIdx;
    const id = `${y}_${m}`;
    const mData = getMonthStorage(y, m);
    return {
        db: 'lifequest-month-vision-images',
        store: 'images',
        prefix: `gallery:${id}:`,
        primaryKey: id,
        legacySrc: mData.image || '',
        isMonth: true,
        clearLegacy: () => { delete mData.image; },
        saveLegacy: () => {
            try {
                localStorage.setItem('lifequest-user-months-v1', JSON.stringify(savedAnnual));
            } catch {}
        }
    };
}

async function readCurrentPointGallery(spec) {
    const gallery = [];
    let primaryFound = false;

    if (spec.primaryKey) {
        const blob = await lqPhotoOp(spec.db, spec.store, 'get', spec.primaryKey);
        if (blob instanceof Blob) {
            gallery.push({
                key: spec.primaryKey,
                src: URL.createObjectURL(blob),
                legacy: false,
                primary: true
            });
            primaryFound = true;
        }
    }

    // Existing single photo becomes the first photo when there is no
    // newer primary key stored in IndexedDB.
    if (!primaryFound && spec.legacySrc) {
        gallery.push({
            key: null,
            src: spec.legacySrc,
            legacy: true,
            primary: true
        });
    }

    gallery.push(...await lqGalleryExtras(spec.db, spec.store, spec.prefix));
    return gallery;
}

function renderMainPointGallery() {
    const entry = mainPointGallery[mainPointPhotoIndex];

    const nav = $('point-gallery-nav');
    const previous = $('point-photo-prev');
    const next = $('point-photo-next');
    const count = $('point-photo-count');

    if (!entry) {
        updateImageUI('');

        if (nav) nav.hidden = true;
        return;
    }

    updateImageUI(entry.src);

    if (nav) nav.hidden = false;

    if (count) {
        count.textContent =
            `${mainPointPhotoIndex + 1} / ${mainPointGallery.length}`;
    }

    if (previous) {
        previous.hidden = mainPointGallery.length < 2;
    }

    if (next) {
        next.hidden = mainPointGallery.length < 2;
    }
}

async function refreshMainPointGallery(preferredIndex = 0) {
    const token = ++mainPointGalleryToken;

    releaseMainPointGallery(mainPointGallery);

    mainPointGallery = [];
    mainPointPhotoIndex = 0;

    renderMainPointGallery();

    let gallery = [];
    const spec = currentPointGallerySpec();
    mainPointGallerySpec = spec;

    try {
        gallery = await readCurrentPointGallery(spec);
    } catch (error) {
        console.error('Could not load milestone photos:', error);
    }

    if (token !== mainPointGalleryToken) {
        releaseMainPointGallery(gallery);
        return;
    }

    mainPointGallery = gallery;

    mainPointPhotoIndex = gallery.length
        ? Math.max(0, Math.min(preferredIndex, gallery.length - 1))
        : 0;

    renderMainPointGallery();
}


function getMonthChapterName(year, mIdx) {
  let mData = getMonthStorage(year, mIdx);
  return (mData && mData.customName !== undefined && mData.customName.trim()) ? mData.customName : monthChapters[mIdx].name;
}
function getMonthChapterTitle(year, mIdx) {
  let mData = getMonthStorage(year, mIdx);
  return (mData && mData.customTitle !== undefined && mData.customTitle.trim()) ? mData.customTitle : monthChapters[mIdx].title;
}
function getMonthChapterImage(year, mIdx) {
  let mData = getMonthStorage(year, mIdx);
  return (mData && mData.image) || '';
}

function getWeekTitle(year, mIdx, wNum) {
  let wData = getWeekStorage(year, mIdx, wNum);
  return (wData && wData.customTitle !== undefined && wData.customTitle.trim()) ? wData.customTitle : ('Week ' + wNum);
}
function getWeekImage(year, mIdx, wNum) {
  let wData = getWeekStorage(year, mIdx, wNum);
  return (wData && wData.image) || '';
}

function compressAndSaveImage(file, callback) {
  if (!file || !file.type.startsWith('image/')) {
    toast('Please select a valid image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      let maxW = 1800, maxH = 1800;
      let w = img.width, h = img.height;
      if (w > maxW || h > maxH) {
        if (w > h) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        } else {
          w = Math.round(w * (maxH / h));
          h = maxH;
        }
      }
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const ctx2 = c.getContext('2d');
      ctx2.drawImage(img, 0, 0, w, h);
      const dataUrl = c.toDataURL('image/jpeg', 0.92);
      callback(dataUrl);
    };
    img.onerror = () => toast('Failed to process image');
    img.src = e.target.result;
  };
  reader.onerror = () => toast('Error reading file');
  reader.readAsDataURL(file);
}

function setImageForCurrentPoint(dataUrl) {
  if (isYearTarget()) {
    yearData[selectedYearIdx].image = dataUrl;
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.image = dataUrl;
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.image = dataUrl;
  }
  saveCurrent();
  renderNav();
  refreshMainPointGallery(0);
  }

function updateImageUI(imgUrl) {
  if (imgUrl) {
    $('point-img-element').src = imgUrl;
    $('img-preview-box').style.display = 'block';
    $('img-status-tag').textContent = 'Image Attached';
    $('img-status-tag').classList.add('has-img');
  } else {
    $('point-img-element').src = '';
    $('img-preview-box').style.display = 'none';
    $('img-status-tag').textContent = 'No image';
    $('img-status-tag').classList.remove('has-img');
  }
}

function saveCurrent() {
  try {
    if (isYearTarget()) {
      persistYearRoadmap();
    } else {
      localStorage.setItem('lifequest-user-months-v1', JSON.stringify(savedAnnual));
      localStorage.setItem('lifequest-user-weeks-v1', JSON.stringify(savedWeeks));
    }
  } catch {
    $('save-note').textContent = 'Storage unavailable — changes last for this visit.';
  }
  renderNav();
}

// Canvas & Camera
const canvas = $('map');
const ctx = canvas.getContext('2d');
const missionBackdrop = new Image();
let missionBackdropReady = false;
missionBackdrop.onload = () => { missionBackdropReady = true; };
missionBackdrop.src = 'assets/mission-trail.png';
let w = 0, h = 0, scale = 1;
let camX = 480, camY = 2400;
let targetCamX = 480, targetCamY = 2400;
let worldView = false, followingPlayer = true;
let player = { x: 480, y: 2500 };
let last = 0;
const W = 1000;
let H = 2700;
let toastTimer;

let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragCamStartX = 480, dragCamStartY = 2400;
let dragDistance = 0;

function clampCam() {
  let halfW = w / scale / 2, halfH = h / scale / 2;
  if (halfW * 2 >= W) targetCamX = W / 2;
  else targetCamX = Math.max(halfW, Math.min(W - halfW, targetCamX));

  if (halfH * 2 >= H) targetCamY = H / 2;
  else targetCamY = Math.max(halfH, Math.min(H - halfH, targetCamY));
}

// Roads generation
function buildRoadPoints(chList) {
  if (!chList.length) return [];
  if (chList.length === 1) return [{ x: chList[0].x, y: chList[0].y }];
  let pts = [];
  for (let j = 0; j < chList.length - 1; j++) {
    let a = chList[j], b = chList[j + 1];
    for (let t = 0; t < 1; t += 0.025) {
      let ease = t * t * (3 - 2 * t);
      pts.push({ x: a.x + (b.x - a.x) * ease, y: a.y + (b.y - a.y) * t });
    }
  }
  pts.push(chList[chList.length - 1]);
  return pts;
}

const yearPoints = buildRoadPoints(chapters);
const monthPoints = buildRoadPoints(monthChapters);

// 4 Weeks between each month along the road
const weekStones = [];
for (let j = 0; j < monthChapters.length - 1; j++) {
  let a = monthChapters[j], b = monthChapters[j + 1];
  let pts = [];
  let tot = 0, prev = { x: a.x, y: a.y };
  pts.push({ x: a.x, y: a.y, len: 0 });
  for (let t = 0.005; t <= 1.0001; t += 0.005) {
    let ease = t * t * (3 - 2 * t);
    let x = a.x + (b.x - a.x) * ease;
    let y = a.y + (b.y - a.y) * t;
    tot += Math.hypot(x - prev.x, y - prev.y);
    pts.push({ x, y, len: tot });
    prev = { x, y };
  }
  let marginA = 55, marginB = 55;
  let usable = tot - marginA - marginB;
  let step = usable / 3;
  for (let wNum = 1; wNum <= 4; wNum++) {
    let target = marginA + (wNum - 1) * step;
    let p = pts.find(pt => pt.len >= target) || pts[pts.length - 1];
    weekStones.push({
      mIndex: j,
      weekNum: wNum,
      monthName: a.name,
      x: Math.round(p.x),
      y: Math.round(p.y)
    });
  }
}

const monthMarkers = [];

// Procedural environment
function roadDist(pts, x, y) {
  let m = 1e9;
  for (let p of pts) m = Math.min(m, Math.hypot(x - p.x, y - p.y));
  return m;
}

let seed = 184;
function rnd() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}
const yearTrees = [], yearRocks = [];
for (let i = 0; i < 1600; i++) {
  let x = rnd() * W, y = rnd() * 2700;
  if (roadDist(yearPoints, x, y) > 75 && chapters.every(c => Math.hypot(x - c.x, y - c.y) > 120)) {
    yearTrees.push({ x, y, s: 12 + rnd() * 19, t: rnd() });
  }
}
for (let i = 0; i < 120; i++) yearRocks.push({ x: rnd() * W, y: rnd() * 2700, s: 20 + rnd() * 50 });

const monthTrees = [], monthRocks = [];
for (let i = 0; i < 2000; i++) {
  let x = rnd() * W, y = rnd() * 3400;
  if (roadDist(monthPoints, x, y) > 75 && monthChapters.every(c => Math.hypot(x - c.x, y - c.y) > 120)) {
    monthTrees.push({ x, y, s: 12 + rnd() * 19, t: rnd() });
  }
}
for (let i = 0; i < 150; i++) monthRocks.push({ x: rnd() * W, y: rnd() * 3400, s: 20 + rnd() * 50 });

function rebuildRoadmapLayout() {
  const stops = [];
  chapters.forEach((chapter, yearIndex) => {
    stops.push({ kind: 'year', chapter, yearIndex, year: Number(chapter.year) });
    MONTH_FULL.forEach((fullName, mIndex) => {
      stops.push({ kind: 'month', yearIndex, year: Number(chapter.year), mIndex, fullName });
    });
  });

  const step = 190;
  H = Math.max(2700, stops.length * step + 100);
  const columns = [480, 690, 365, 670, 350, 655, 480];
  stops.forEach((stop, index) => {
    stop.x = columns[index % columns.length];
    stop.y = H - 100 - index * step;
    if (stop.kind === 'year') {
      stop.chapter.x = stop.x;
      stop.chapter.y = stop.y;
    }
  });

  yearPoints.splice(0, yearPoints.length, ...buildRoadPoints(stops));
  monthMarkers.splice(0, monthMarkers.length);
  stops.forEach((stop, index) => {
    if (stop.kind !== 'month') return;
    const before = stops[Math.max(0, index - 1)] || stop;
    const after = stops[Math.min(stops.length - 1, index + 1)] || stop;
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    const side = stop.mIndex % 2 === 0 ? 1 : -1;
    const nx = -dy / length * side;
    const ny = dx / length * side;
    monthMarkers.push({
      seg: stop.yearIndex, mIndex: stop.mIndex, year: stop.year,
      name: MONTH_NAMES[stop.mIndex], fullName: stop.fullName,
      isQuarter: stop.mIndex % 3 === 0,
      x: Math.round(stop.x + nx * 42), y: Math.round(stop.y + ny * 42),
      roadX: stop.x, roadY: stop.y
    });
  });

  yearTrees.length = 0;
  yearRocks.length = 0;
  let state = 184;
  function random() {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  }
  const attempts = Math.min(10000, Math.round(1050 * H / 2700));
  for (let i = 0; i < attempts; i++) {
    const x = random() * W;
    const y = random() * H;
    const nearRoad = yearPoints.some(p => Math.abs(p.y - y) < 84 && Math.hypot(x - p.x, y - p.y) < 78);
    const nearStop = stops.some(s => Math.abs(s.y - y) < 130 && Math.hypot(x - s.x, y - s.y) < 140);
    if (!nearRoad && !nearStop) yearTrees.push({ x, y, s: 12 + random() * 19, t: random() });
  }
  const rockCount = Math.min(1500, Math.round(120 * H / 2700));
  for (let i = 0; i < rockCount; i++) yearRocks.push({ x: random() * W, y: random() * H, s: 20 + random() * 50 });

  if (chapters.length) {
    const selected = chapters[selectedYearIdx] || chapters[0];
    player.x = selected.x;
    player.y = selected.y + 70;
    targetCamX = selected.x;
    targetCamY = selected.y;
  } else {
    player.x = 480;
    player.y = H / 2;
    targetCamX = 480;
    targetCamY = H / 2;
  }
  camX = targetCamX;
  camY = targetCamY;
  clampCam();
}

// Drawing Helpers
function poly(ps, color) {
  ctx.beginPath();
  ps.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function ellipse(x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function tree(t) {
  let { x, y, s } = t;
  const crown = t.t > .58 ? '#4d9b43' : '#39863d';
  ellipse(x + 5, y + 5, s * .82, s * .35, '#28492b66');
  ctx.fillStyle = '#76532d';
  ctx.fillRect(x - 2, y - 4, 5, 13);
  ellipse(x, y - s * .58, s * .82, s * .61, '#28633a');
  ellipse(x - s * .36, y - s * .75, s * .48, s * .47, crown);
  ellipse(x + s * .31, y - s * .77, s * .48, s * .47, t.t > .58 ? '#5eaa49' : '#449247');
  ellipse(x + s * .02, y - s * 1.12, s * .47, s * .49, t.t > .58 ? '#75ba51' : '#56a348');
  ellipse(x - s * .13, y - s * 1.25, s * .13, s * .09, '#c4d96c99');
}

function box(x, y, ww, hh, depth, color) {
  poly([[x - ww / 2, y], [x, y + depth], [x + ww / 2, y], [x, y - depth]], '#556b50');
  poly([[x - ww / 2, y], [x, y + depth], [x, y + depth - hh], [x - ww / 2, y - hh]], color);
  poly([[x, y + depth], [x + ww / 2, y], [x + ww / 2, y - hh], [x, y + depth - hh]], '#263d35');
  poly([[x - ww / 2, y - hh], [x, y - hh + depth], [x + ww / 2, y - hh], [x, y - hh - depth]], '#839381');
  for (let j = 12; j < hh - 3; j += 15) {
    ctx.fillStyle = '#d3bc75';
    ctx.fillRect(x - ww * .32, y - j, 5, 6);
    ctx.fillRect(x - ww * .15, y - j + 5, 5, 6);
  }
}


function drawRoadsideMonth(m, now) {
  let { x, y, roadX, roadY, name, year, seg, mIndex, isQuarter } = m;
  let isDone = getMonthStorage(year, mIndex).done;
  let cur = new Date(), curYear = cur.getFullYear(), curMonth = cur.getMonth();
  let isNow = (year === curYear && mIndex === curMonth);

  ctx.save();
  // Dashed connector peg to road
  ctx.strokeStyle = isNow ? '#f3d78baa' : (isDone ? '#eed18988' : (isQuarter ? '#cbb87c77' : '#5f796688'));
  ctx.lineWidth = isNow ? 2 : 1.5;
  ctx.setLineDash([3, 2]);
  ctx.beginPath();
  ctx.moveTo(roadX, roadY);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.setLineDash([]);

  // Road anchor dot on road surface
  ctx.fillStyle = isNow ? '#f3d78b' : (isDone ? '#eed189' : (isQuarter ? '#d8c288' : '#88a38e'));
  ctx.beginPath();
  ctx.arc(roadX, roadY, isNow ? 3.5 : 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0b1d16';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Ground shadow
  ellipse(x, y + 7, 16, 6, '#0c211c88');

  // Pill badge dimension (larger, crisper, high visibility)
  let pw = 34, ph = 16;
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x - pw / 2, y - ph / 2, pw, ph, 4);
  } else {
    ctx.rect(x - pw / 2, y - ph / 2, pw, ph);
  }
  ctx.fillStyle = isNow ? '#2e3f26' : (isDone ? '#1b3827' : (isQuarter ? '#1b3024' : '#13251d'));
  ctx.fill();
  ctx.strokeStyle = isNow ? '#f6de96' : (isDone ? '#eed189' : (isQuarter ? '#d4be80' : '#45614e'));
  ctx.lineWidth = isNow ? 2 : (isDone || isQuarter ? 1.4 : 1.1);
  ctx.stroke();

  // Text label
  ctx.font = isNow ? 'bold 9.5px sans-serif' : ((isQuarter || isDone) ? 'bold 9px sans-serif' : '600 8.5px sans-serif');
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isNow ? '#fff0ba' : (isDone ? '#eed189' : (isQuarter ? '#f3dd9f' : '#c8d9c6'));
  ctx.fillText(name.toUpperCase(), x, y + 0.5);
  ctx.textBaseline = 'alphabetic';

  // Real-world NOW beacon with pulsing outer ring
  if (isNow) {
    let pulse = 2 + Math.sin((now || 0) / 220) * 2;
    ctx.strokeStyle = '#f3d78baa';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x - pw / 2 - pulse, y - ph / 2 - pulse, pw + pulse * 2, ph + pulse * 2, 6);
    }
    ctx.stroke();

    ctx.fillStyle = '#f3d78b';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.fillText('NOW ✧', x, y - 11);
  }

  ctx.restore();
}

function drawLandmark(c, i, isSelected, isDone, labelTop, labelBottom, hasImage = false) {
  let { x, y } = c;
  ellipse(x, y + 12, 83, 43, '#112b2490');
  ellipse(x, y + 5, 76, 37, '#536948');
  ellipse(x, y, 68, 31, '#6b7953');
  ctx.strokeStyle = isSelected ? '#e8cc83' : '#8b9d6b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, 80, 39, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (c.type === 'office') {
    box(x - 19, y - 1, 51, 93, 15, '#587577');
    box(x + 24, y + 9, 45, 64, 14, '#6b7b70');
  } else if (c.type === 'camp') {
    poly([[x - 43, y + 5], [x - 8, y - 52], [x + 28, y + 6]], '#dbb976');
    poly([[x - 8, y - 52], [x + 49, y - 8], [x + 28, y + 6]], '#8e794d');
    poly([[x - 15, y + 5], [x - 8, y - 25], [x + 7, y + 5]], '#393e2b');
    ellipse(x + 43, y + 20, 11, 5, '#ffc477');
    poly([[x + 36, y + 18], [x + 43, y - 5], [x + 50, y + 18]], '#ffb35c');
  } else if (c.type === 'tower') {
    box(x, y, 70, 29, 20, '#596f65');
    ctx.strokeStyle = '#b5c2ae';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 23, y - 15);
    ctx.lineTo(x, y - 110);
    ctx.lineTo(x + 23, y - 15);
    ctx.moveTo(x - 15, y - 50);
    ctx.lineTo(x + 15, y - 50);
    ctx.moveTo(x - 8, y - 80);
    ctx.lineTo(x + 8, y - 80);
    ctx.stroke();
    ellipse(x, y - 110, 5, 5, '#e9ca7e');
    for (let j = 0; j < 2; j++) {
      ctx.strokeStyle = '#cfcc8b88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y - 110, 15 + j * 12, -.9, .9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y - 110, 15 + j * 12, Math.PI - .9, Math.PI + .9);
      ctx.stroke();
    }
  } else if (c.type === 'garage') {
    box(x, y - 12, 105, 37, 25, '#887e5d');
    ctx.fillStyle = '#24382f';
    ctx.fillRect(x - 30, y - 40, 30, 25);
    ellipse(x + 20, y + 25, 30, 10, '#1d322a');
    poly([[x - 10, y + 17], [x + 8, y + 3], [x + 44, y + 7], [x + 53, y + 21], [x + 32, y + 30]], '#d6b569');
    poly([[x + 5, y + 12], [x + 15, y + 5], [x + 33, y + 8], [x + 37, y + 17]], '#3f645e');
    ellipse(x + 3, y + 23, 5, 7, '#18251e');
    ellipse(x + 40, y + 25, 5, 7, '#18251e');
  } else if (c.type === 'summit') {
    poly([[x - 65, y], [x - 20, y - 75], [x + 8, y - 117], [x + 60, y + 4]], '#7f8b76');
    poly([[x + 8, y - 117], [x + 60, y + 4], [x + 6, y - 10]], '#4b6355');
    poly([[x - 10, y - 90], [x + 8, y - 117], [x + 26, y - 78], [x + 6, y - 89], [x - 1, y - 80]], '#d5dcc7');
    ctx.strokeStyle = '#e3d8aa';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 115);
    ctx.lineTo(x + 8, y - 155);
    ctx.stroke();
    poly([[x + 9, y - 155], [x + 40, y - 146], [x + 9, y - 133]], '#edcc77');
  } else {
    box(x, y, 85, 48, 24, c.type === 'palace' ? '#b6af89' : '#78867b');
    box(x - 42, y - 8, 28, 65, 12, '#879580');
    box(x + 42, y - 8, 28, 65, 12, '#879580');
    poly([[x - 59, y - 73], [x - 42, y - 98], [x - 24, y - 73]], '#425f58');
    poly([[x + 25, y - 73], [x + 42, y - 98], [x + 59, y - 73]], '#425f58');
    poly([[x - 45, y - 48], [x, y - 84], [x + 45, y - 48], [x, y - 25]], c.type === 'palace' ? '#617c70' : '#536e66');
    ctx.fillStyle = '#d3bb7d';
    ctx.fillRect(x - 7, y - 14, 14, 22);
  }

  ctx.textAlign = 'center';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#142b23';
  ctx.fillRect(x - 30, y + 48, 60, 22);
  ctx.fillStyle = '#ebd49c';
  ctx.fillText(labelTop, x, y + 63);
  ctx.font = '600 13px sans-serif';
  ctx.shadowColor = '#10241e';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#e5e7c9';
  ctx.fillText(labelBottom.toUpperCase(), x, y + 89);
  ctx.shadowBlur = 0;

  
  if (hasImage) {
    ctx.font = '14px sans-serif';
    ctx.fillText('🖼️', x - 72, y - 28);
  }

  if (isDone) {
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#eed189';
    ctx.fillText('⚑', x + 80, y - 35);
  }
}

// Week Stepping Stone Drawing
function drawWeekStone(w, now) {
  let isSelected = selectedWeekNode && selectedWeekNode.mIndex === w.mIndex && selectedWeekNode.weekNum === w.weekNum;
  let wData = getWeekStorage(selectedYear, w.mIndex, w.weekNum);
  let isDone = wData.done;

  // Ground shadow
  ellipse(w.x, w.y + 4, 15, 6, '#0c211c66');

  // Stepping stone platform
  ctx.beginPath();
  ctx.arc(w.x, w.y, 14, 0, Math.PI * 2);
  ctx.fillStyle = isDone ? '#21462d' : (isSelected ? '#2f4436' : '#152b20');
  ctx.fill();

  ctx.strokeStyle = isSelected ? '#f3d78b' : (isDone ? '#eed189' : '#476251');
  ctx.lineWidth = isSelected ? 2.5 : 1.5;
  ctx.stroke();

  // Text label "W1", "W2", etc.
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = isSelected ? '#fff' : (isDone ? '#f2dba4' : '#b2c5b3');
  ctx.fillText('W' + w.weekNum, w.x, w.y);
  let hasStoneImg = Boolean(getWeekImage(selectedYear, w.mIndex, w.weekNum));
  if (hasStoneImg) {
    ctx.font = '8px sans-serif';
    ctx.fillText('🖼️', w.x + 13, w.y - 10);
  }
  ctx.textBaseline = 'alphabetic';

  if (isSelected) {
    let pulse = 2 + Math.sin(now / 200) * 1.5;
    ctx.strokeStyle = '#f3d78baa';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w.x, w.y, 17 + pulse, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Terrain Renderer
function drawMissionBackdrop() {
  const segmentHeight = 190 * (MONTH_FULL.length + 1);
  const count = Math.max(1, chapters.length);
  const visibleTop = camY - h / (2 * scale) - segmentHeight;
  const visibleBottom = camY + h / (2 * scale) + segmentHeight;

  if (!chapters.length) {
    ctx.drawImage(missionBackdrop, 0, 0, W, H);
    return;
  }

  chapters.forEach((_, index) => {
    const bottom = H - 100 - index * segmentHeight;
    const top = bottom - segmentHeight;
    if (bottom < visibleTop || top > visibleBottom) return;
    ctx.save();
    if (index % 2 === 1) {
      ctx.translate(W, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(missionBackdrop, 0, 0, missionBackdrop.naturalWidth, missionBackdrop.naturalHeight,
      0, top, W, segmentHeight);
    ctx.restore();
  });

  // Extend the camp and summit artwork into the map's small end margins.
  const coveredTop = H - 100 - count * segmentHeight;
  if (coveredTop > 0 && visibleTop < coveredTop) {
    ctx.drawImage(missionBackdrop, 0, 0, missionBackdrop.naturalWidth, missionBackdrop.naturalHeight * .1,
      0, 0, W, coveredTop);
  }
  if (visibleBottom > H - 100) {
    ctx.drawImage(missionBackdrop, 0, missionBackdrop.naturalHeight * .9,
      missionBackdrop.naturalWidth, missionBackdrop.naturalHeight * .1, 0, H - 100, W, 100);
  }
}

function drawTerrain(now) {
  let isYear = currentMode === 'years';
  let curPts = isYear ? yearPoints : monthPoints;
  let curTrees = isYear ? yearTrees : monthTrees;
  let curRocks = isYear ? yearRocks : monthRocks;
  const useMissionArt = isYear && missionBackdropReady;

  if (useMissionArt) {
    drawMissionBackdrop();
  } else {
    const meadow = ctx.createLinearGradient(0, 0, W, H);
    meadow.addColorStop(0, '#526c49');
    meadow.addColorStop(.48, '#3c5941');
    meadow.addColorStop(1, '#293c39');
    ctx.fillStyle = meadow;
    ctx.fillRect(0, 0, W, H);

    // Ambient rocks for the forest fallback.
    for (let r of curRocks) {
      ellipse(r.x, r.y, r.s * 2, r.s, '#496b3a35');
      if (r.x < 120 || r.x > 880) {
        poly([[r.x - r.s, r.y], [r.x, r.y - r.s * 1.2], [r.x + r.s * .8, r.y + 10]], '#a4a884');
        poly([[r.x, r.y - r.s * 1.2], [r.x + r.s * .8, r.y + 10], [r.x + 4, r.y]], '#777f62');
      }
    }

    // Natural River
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#648a45';
    ctx.lineWidth = 78;
    ctx.beginPath();
    ctx.moveTo(0, 1900);
    ctx.bezierCurveTo(300, 1940, 110, 1530, 40, 1200);
    ctx.bezierCurveTo(-40, 900, 190, 650, 110, 0);
    ctx.stroke();
    ctx.strokeStyle = '#43b9bd';
    ctx.lineWidth = 54;
    ctx.stroke();
    ctx.strokeStyle = '#8ce0d1aa';
    ctx.lineWidth = 4;
    ctx.setLineDash([20, 31]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Winding sunlit dirt road.
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let [color, width] of [['#74502e', 59], ['#b77b3f', 48], ['#e0b66d', 36], ['#f0d08b', 23]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    curPts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.stroke();
  }

  // Chevrons
  for (let i = 10; i < curPts.length - 4; i += 11) {
    let p = curPts[i], q = curPts[i + 1], a = Math.atan2(q.y - p.y, q.x - p.x);
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(a);
    ctx.strokeStyle = '#fff0bd99';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-5, -5);
    ctx.lineTo(1, 0);
    ctx.lineTo(-5, 5);
    ctx.stroke();
    ctx.restore();
  }

  // Trees remain as a fallback when the campaign artwork cannot load.
  if (!useMissionArt) curTrees.forEach(tree);

  if (isYear) {
    // 12 Months alongside the road between every year (72 roadside milestones)
    monthMarkers.forEach(m => drawRoadsideMonth(m, now));

    // 7 Year Landmarks
    chapters.forEach((c, i) => {
      let dispName = getYearChapterName(i);
      let hasImg = hasYearChapterImage(i);
      drawLandmark(c, i, i === selectedYearIdx, yearData[i].done, String(c.year), dispName, hasImg);
    });

    if (!chapters.length) {
      ctx.font = 'bold 20px sans-serif';
      ctx.fillStyle = '#f3d78b';
      ctx.fillText('ADD A YEAR TO BEGIN', 480, H / 2);
    }
  } else {
    // 44 Week Stepping Stones
    weekStones.forEach(w => drawWeekStone(w, now));

    // 12 Month Landmarks
    monthChapters.forEach((c, i) => {
      let isDone = getMonthStorage(selectedYear, i).done;
      let isSel = (!selectedWeekNode && i === selectedMonthIdx);
      let dispName = getMonthChapterName(selectedYear, i);
      let hasImg = Boolean(getMonthChapterImage(selectedYear, i));
      drawLandmark(c, i, isSel, isDone, "MONTH " + String(i + 1).padStart(2, '0'), dispName, hasImg);
    });

    ctx.font = 'italic 25px Georgia';
    ctx.fillStyle = '#c4d6b124';
    ctx.textAlign = 'center';
    ctx.save();
    ctx.translate(180, 2900);
    ctx.rotate(-.3);
    ctx.fillText('The Season Woods', 0, 0);
    ctx.restore();
    ctx.fillText('YEAR-END ASCENT', 480, 420);
  }
}

// Resizing
function resize() {
  let r = canvas.getBoundingClientRect();
  w = r.width;
  h = r.height;
  let d = Math.min(devicePixelRatio || 1, 2);
  canvas.width = w * d;
  canvas.height = h * d;
  ctx.setTransform(d, 0, 0, d, 0, 0);
}
new ResizeObserver(resize).observe(canvas);

// Navigation UI rendering
function renderNav() {
  $('chapters').innerHTML = '';
  if (currentMode === 'years') {
    chapters.forEach((c, i) => {
      let b = document.createElement('button');
      b.className = 'chapter' + (i === selectedYearIdx ? ' active' : '');
      const number = document.createElement('span');
      number.className = 'num';
      number.textContent = yearData[i].done ? '✓' : String(i + 1).padStart(2, '0');
      const label = document.createElement('span');
      const year = document.createElement('small');
      year.textContent = c.year;
      const name = document.createElement('strong');
      name.textContent = getYearChapterName(i);
      label.append(year, name);
      b.append(number, label);
      b.onclick = () => selectYearChapter(i, true);

      const row = document.createElement('div');
      row.className = 'chapter-row';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'chapter-delete';
      remove.textContent = 'Delete';
      remove.setAttribute('aria-label', `Delete year ${c.year}`);
      remove.title = `Delete year ${c.year}`;
      remove.onclick = event => {
        event.stopPropagation();
        deleteRoadmapYear(i);
      };
      row.append(b, remove);
      $('chapters').appendChild(row);
    });
    const yearDone = yearData.filter(d => d.done).length;
    const monthDone = chapters.reduce((count, chapter) => count + MONTH_FULL.reduce(
      (done, _, month) => done + (savedAnnual[`${chapter.year}_${month}`]?.done ? 1 : 0), 0
    ), 0);
    const total = chapters.length * (MONTH_FULL.length + 1);
    const done = yearDone + monthDone;
    $('count').textContent = `${done} / ${total}`;
    $('bar').style.width = (total ? done / total * 100 : 0) + '%';
  } else {
    monthChapters.forEach((c, i) => {
      let mData = getMonthStorage(selectedYear, i);
      let isSel = (!selectedWeekNode && i === selectedMonthIdx);
      let b = document.createElement('button');
      b.className = 'chapter' + (isSel ? ' active' : '');
      b.innerHTML = `<span class="num">${mData.done ? '✓' : String(i + 1).padStart(2, '0')}</span><span><small>MONTH ${i + 1}</small><strong>${c.name}</strong></span>`;
      b.onclick = () => selectMonthChapter(i, true);
      $('chapters').appendChild(b);
    });
    let n = monthChapters.filter((c, i) => getMonthStorage(selectedYear, i).done).length;
    $('count').textContent = n + ' / 12';
    $('bar').style.width = (n / 12 * 100) + '%';
  }
}

function renderTasks(tasks) {
  $('tasks').innerHTML = '';
  tasks.forEach((t, i) => {
    let row = document.createElement('div');
    row.className = 'task';
    let cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = t.done;
    cb.setAttribute('aria-label', 'Complete quest ' + (i + 1));
    cb.onchange = () => {
      t.done = cb.checked;
      saveCurrent();
      renderNav();
    };
    let input = document.createElement('input');
    input.type = 'text';
    input.value = t.text;
    input.setAttribute('aria-label', 'Quest ' + (i + 1));
    input.oninput = () => {
      t.text = input.value;
      saveCurrent();
    };
    let del = document.createElement('button');
    del.className = 'delete';
    del.textContent = '×';
    del.setAttribute('aria-label', 'Remove quest ' + (i + 1));
    del.onclick = () => {
      tasks.splice(i, 1);
      saveCurrent();
      renderTasks(tasks);
    };
    row.append(cb, input, del);
    $('tasks').appendChild(row);
  });
}

// Select a user-created year.
function selectYearChapter(i, move = false) {
  if (!chapters[i] || !yearData[i]) {
    selectedRoadmapMonth = false;
    $('detail-eyebrow').textContent = 'YOUR ROADMAP';
    $('chapter-number').textContent = 'NO YEARS';
    $('badge').textContent = '—';
    $('biome').textContent = 'ADD A YEAR TO BEGIN';
    $('point-name-input').value = '';
    $('point-title-input').value = '';
    $('goal').textContent = '';
    $('maptitle').textContent = 'Your roadmap';
    $('description').textContent = 'Add a year to create its 12 monthly milestones on this same road.';
    $('notes').value = '';
    $('complete').disabled = true;
    $('add').disabled = true;
    $('point-name-input').disabled = true;
    $('point-title-input').disabled = true;
    $('notes').disabled = true;
    $('image-file-input').disabled = true;
    $('toggle-url-btn').disabled = true;
    $('remove-img-btn').disabled = true;
    renderTasks([]);
    updateImageUI('');
    renderNav();
    return;
  }

  selectedRoadmapMonth = false;
  $('complete').disabled = false;
  $('add').disabled = false;
  $('point-name-input').disabled = false;
  $('point-title-input').disabled = false;
  $('notes').disabled = false;
  $('image-file-input').disabled = false;
  $('toggle-url-btn').disabled = false;
  $('remove-img-btn').disabled = false;
  selectedYearIdx = i;
  selectedYear = Number(chapters[i].year);
  let c = chapters[i];
  let curData = yearData[i];
  let name = getYearChapterName(i);
  let title = getYearChapterTitle(i);
  let image = getYearChapterImage(i);

  $('detail-eyebrow').textContent = 'MISSION BRIEFING';
  $('chapter-number').textContent = String(i + 1).padStart(2, '0') + ' / ' + String(chapters.length).padStart(2, '0');
  $('badge').textContent = c.year;
  $('biome').textContent = name.toUpperCase();
  $('point-name-input').value = (curData.customName !== undefined) ? curData.customName : c.name;
  $('point-title-input').value = (curData.customTitle !== undefined) ? curData.customTitle : c.title;
  $('goal').textContent = title;
  $('maptitle').textContent = title || name;
  $('description').textContent = c.desc;
  $('location').textContent = 'YEAR ' + c.year + ' · ' + name.toUpperCase();
  $('notes').value = curData.notes;
  $('complete').textContent = curData.done ? '✓ Achieved · click to undo' : '⚑ Mark milestone achieved';
  $('cal-link').style.display = 'none';

  refreshMainPointGallery(0);
  renderTasks(curData.tasks);
  renderNav();

  if (move) {
    worldView = false;
    player.x = c.x;
    player.y = c.y + 70;
    targetCamX = c.x;
    targetCamY = c.y;
    clampCam();
    followingPlayer = true;
    updateViewButton();
  }
}

// Select a month stop on the main roadmap.
function selectMonthChapter(i, move = false) {
  selectedRoadmapMonth = currentMode === 'years';
  selectedMonthIdx = i;
  selectedWeekNode = null;
  let c = monthChapters[i];
  let curData = getMonthStorage(selectedYear, i);
  let name = getMonthChapterName(selectedYear, i);
  let title = getMonthChapterTitle(selectedYear, i);
  let image = getMonthChapterImage(selectedYear, i);

  $('detail-eyebrow').textContent = 'MONTHLY BRIEFING';
  $('chapter-number').textContent = String(i + 1).padStart(2, '0') + ' / 12';
  $('badge').textContent = selectedYear + ' · ' + name.toUpperCase();
  $('biome').textContent = c.place.toUpperCase();
  $('point-name-input').value = (curData.customName !== undefined) ? curData.customName : c.name;
  $('point-title-input').value = (curData.customTitle !== undefined) ? curData.customTitle : c.title;
  $('goal').textContent = title;
  $('maptitle').textContent = name + ' · ' + title;
  $('description').textContent = c.desc;
  $('location').textContent = 'MONTH ' + String(i + 1).padStart(2, '0') + ' · ' + name.toUpperCase();
  $('notes').value = curData.notes;
  $('complete').textContent = curData.done ? '✓ Month achieved · click to undo' : '⚑ Mark month achieved';

  let mm = String(i + 1).padStart(2, '0');
  $('cal-link').style.display = 'flex';
  $('cal-link').href = 'https://calendar.google.com/calendar/r/month/' + selectedYear + '/' + mm + '/01';
  $('cal-link-text').textContent = 'Open ' + name + ' ' + selectedYear + ' in Google Calendar ↗';

  refreshMainPointGallery(0);
  renderTasks(curData.tasks);
  renderNav();

  if (move) {
    worldView = false;
    player.x = c.x;
    player.y = c.y + 70;
    targetCamX = c.x;
    targetCamY = c.y;
    clampCam();
    followingPlayer = true;
    updateViewButton();
  }
}

// Select a week from the current month.
function selectWeekNode(w) {
  selectedWeekNode = w;
  selectedMonthIdx = w.mIndex;
  let m = monthChapters[w.mIndex];
  let curData = getWeekStorage(selectedYear, w.mIndex, w.weekNum);
  let defaultName = w.monthName + ' Week ' + w.weekNum;
  let name = (curData.customName !== undefined) ? curData.customName : defaultName;
  let title = getWeekTitle(selectedYear, w.mIndex, w.weekNum);
  let image = getWeekImage(selectedYear, w.mIndex, w.weekNum);

  $('detail-eyebrow').textContent = 'WEEKLY HOP SPRINT';
  $('chapter-number').textContent = 'WEEK 0' + w.weekNum + ' / 04';
  $('badge').textContent = 'WEEK 0' + w.weekNum;
  $('biome').textContent = w.monthName.toUpperCase() + ' · WEEK 0' + w.weekNum + ' SPRINT';
  $('point-name-input').value = name;
  $('point-title-input').value = (curData.customTitle !== undefined) ? curData.customTitle : title;
  $('goal').textContent = title;
  $('maptitle').textContent = w.monthName + ' · ' + title;
  $('description').textContent = 'Add the objectives you want to focus on this week.';
  $('location').textContent = w.monthName.toUpperCase() + ' · WEEK 0' + w.weekNum;
  $('notes').value = curData.notes;
  $('complete').textContent = curData.done ? '✓ Week completed · click to undo' : '⚑ Mark week completed';

  let mm = String(w.mIndex + 1).padStart(2, '0');
  $('cal-link').style.display = 'flex';
  $('cal-link').href = 'https://calendar.google.com/calendar/r/month/' + selectedYear + '/' + mm + '/01';
  $('cal-link-text').textContent = 'Open ' + w.monthName + ' ' + selectedYear + ' in Google Calendar ↗';

  refreshMainPointGallery(0);
  renderTasks(curData.tasks);
  renderNav();

  // Hop avatar to stepping stone!
  worldView = false;
  player.x = w.x;
  player.y = w.y;
  targetCamX = w.x;
  targetCamY = w.y;
  clampCam();
  followingPlayer = true;
  updateViewButton();

  toast('Hopped to ' + w.monthName + ' Week ' + w.weekNum + '!');
}

// The year and month markers share one roadmap.
function switchMode(mode) {
  if (mode !== 'years') return;
  currentMode = 'years';
  $('switch-years').classList.add('active');
  $('switch-months').classList.remove('active');
  $('switch-years').setAttribute('aria-selected', 'true');
  $('switch-months').setAttribute('aria-selected', 'false');
  $('year-select').hidden = true;
  rebuildRoadmapLayout();
  $('region-tag').innerHTML = 'MY ROADMAP<small id="location">YOUR YEARS AND MONTHS</small>';
  selectYearChapter(selectedYearIdx, true);
  resize();
}
$('switch-years').onclick = () => switchMode('years');
$('switch-months').onclick = () => switchMode('months');
$('year-select').onchange = e => {
  selectedYear = parseInt(e.target.value, 10);
  switchMode('months');
};
function refreshYearOptions() {
  const select = $('year-select');
  select.replaceChildren(...chapters.map(chapter => new Option(String(chapter.year), String(chapter.year))));
  if (chapters.length) select.value = String(chapters[selectedYearIdx]?.year || chapters[0].year);
}

function addRoadmapYear(details) {
  const year = Number(details.year);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error('Enter a year between 1900 and 2200.');
  if (chapters.some(chapter => Number(chapter.year) === year)) throw new Error(`Year ${year} is already on your roadmap.`);

  const name = String(details.name || '').trim() || `Year ${year}`;
  const chapter = {
    year, name, place: name,
    title: String(details.title || '').trim(),
    desc: String(details.description || '').trim(),
    x: 480, y: 0, type: 'camp'
  };
  const records = chapters.map((item, index) => ({ chapter: item, data: yearData[index] }));
  records.push({ chapter, data: {
    tasks: Array.isArray(details.tasks) ? details.tasks : [], notes: '',
    done: Boolean(details.done), hasGalleryPhotos: Boolean(details.hasGalleryPhotos)
  } });
  records.sort((a, b) => Number(a.chapter.year) - Number(b.chapter.year));
  chapters.splice(0, chapters.length, ...records.map(record => record.chapter));
  yearData.splice(0, yearData.length, ...records.map(record => record.data));

  selectedYearIdx = chapters.findIndex(item => Number(item.year) === year);
  selectedYear = year;
  currentMode = 'years';
  selectedRoadmapMonth = false;
  refreshYearOptions();
  rebuildRoadmapLayout();
  persistYearRoadmap();
  selectYearChapter(selectedYearIdx, true);
  renderNav();
  window.dispatchEvent(new Event('lifequest:roadmap-change'));
  if (!details.silent) toast(`Year ${year} added with 12 months.`);
  return chapter;
}

async function deleteRoadmapYear(index) {
  const chapter = chapters[index];
  if (!chapter) return;
  const year = Number(chapter.year);
  const photoPrefix = yearPhotoPrefix(index);
  if (!confirm(`Delete ${year} and its month, week, day plans, and photos? This cannot be undone.`)) return;

  let hierarchyState = {};
  try { hierarchyState = JSON.parse(localStorage.getItem('lifequest-user-hierarchy-v1') || '{}'); } catch {}
  const hierarchyIDs = Object.keys(hierarchyState).filter(key =>
    key.startsWith(`week:${year}-`) || key.startsWith(`day:${year}-`)
  );
  const nestedGoalIDs = hierarchyIDs.flatMap(key =>
    (Array.isArray(hierarchyState[key]?.milestones) ? hierarchyState[key].milestones : [])
      .map(milestone => milestone?.id).filter(Boolean)
  );
  hierarchyIDs.forEach(key => delete hierarchyState[key]);

  chapters.splice(index, 1);
  yearData.splice(index, 1);
  Object.keys(savedAnnual).forEach(key => { if (key.startsWith(`${year}_`)) delete savedAnnual[key]; });
  Object.keys(savedWeeks).forEach(key => { if (key.startsWith(`${year}_`)) delete savedWeeks[key]; });
  try {
    localStorage.setItem('lifequest-user-months-v1', JSON.stringify(savedAnnual));
    localStorage.setItem('lifequest-user-weeks-v1', JSON.stringify(savedWeeks));
    localStorage.setItem('lifequest-user-hierarchy-v1', JSON.stringify(hierarchyState));
    const photos = await yearPhotoOp('list', photoPrefix);
    for (const photo of photos) await yearPhotoOp('delete', photo.key);
    for (const id of hierarchyIDs) {
      await lqPhotoOp('lifequest-hierarchy-photos-v1', 'photos', 'delete', id);
      const extras = await lqPhotoOp('lifequest-hierarchy-photos-v1', 'photos', 'list', `gallery:${id}:`);
      for (const photo of extras) await lqPhotoOp('lifequest-hierarchy-photos-v1', 'photos', 'delete', photo.key);
    }
    for (const id of nestedGoalIDs) {
      await lqPhotoOp('lifequest-hierarchy-photos-v1', 'photos', 'delete', `goal:${id}`);
      const extras = await lqPhotoOp('lifequest-hierarchy-photos-v1', 'photos', 'list', `gallery:goal:${id}:`);
      for (const photo of extras) await lqPhotoOp('lifequest-hierarchy-photos-v1', 'photos', 'delete', photo.key);
    }
    for (let month = 0; month < 12; month++) {
      const id = `${year}_${month}`;
      await lqPhotoOp('lifequest-month-vision-images', 'images', 'delete', id);
      const extras = await lqPhotoOp('lifequest-month-vision-images', 'images', 'list', `gallery:${id}:`);
      for (const photo of extras) await lqPhotoOp('lifequest-month-vision-images', 'images', 'delete', photo.key);
    }
  } catch (error) {
    console.warn(`Some stored data for ${year} could not be removed.`, error);
  }

  selectedYearIdx = Math.max(0, Math.min(index, chapters.length - 1));
  selectedYear = chapters[selectedYearIdx]?.year || new Date().getFullYear();
  selectedRoadmapMonth = false;
  refreshYearOptions();
  rebuildRoadmapLayout();
  persistYearRoadmap();
  selectYearChapter(selectedYearIdx, true);
  renderNav();
  window.dispatchEvent(new Event('lifequest:roadmap-change'));
}

function selectRoadmapYear(year) {
  const index = chapters.findIndex(chapter => Number(chapter.year) === Number(year));
  if (index < 0) return;
  selectedYearIdx = index;
  selectedYear = Number(year);
  selectedRoadmapMonth = false;
  currentMode = 'years';
  selectYearChapter(index, true);
}

window.LQRoadmap = {
  unified: true,
  addYear: addRoadmapYear,
  deleteYear: deleteRoadmapYear,
  selectYear: selectRoadmapYear,
  get nextYear() {
    let year = new Date().getFullYear();
    while (chapters.some(chapter => Number(chapter.year) === year)) year++;
    return year;
  },
  get firstYear() { return chapters.length ? Number(chapters[0].year) : null; },
  get lastYear() { return chapters.length ? Number(chapters[chapters.length - 1].year) : null; },
  get hasYears() { return chapters.length > 0; }
};
// Notes & Tasks Actions
$('notes').oninput = () => {
  if (isYearTarget()) {
    yearData[selectedYearIdx].notes = $('notes').value;
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.notes = $('notes').value;
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.notes = $('notes').value;
  }
  saveCurrent();
};

$('add').onclick = () => {
  if (isYearTarget()) {
    yearData[selectedYearIdx].tasks.push({ text: 'My next step', done: false });
    renderTasks(yearData[selectedYearIdx].tasks);
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.tasks.push({ text: `Week ${selectedWeekNode.weekNum} task`, done: false });
    renderTasks(wData.tasks);
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.tasks.push({ text: 'My next monthly step', done: false });
    renderTasks(mData.tasks);
  }
  saveCurrent();
  let lastInp = $('tasks').lastChild && $('tasks').lastChild.querySelector('input[type=text]');
  if (lastInp) lastInp.focus();
};

$('complete').onclick = () => {
  if (isYearTarget()) {
    yearData[selectedYearIdx].done = !yearData[selectedYearIdx].done;
    saveCurrent();
    selectYearChapter(selectedYearIdx);
    toast(yearData[selectedYearIdx].done ? 'Achievement unlocked! Milestone achieved.' : 'Milestone reopened.');
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.done = !wData.done;
    saveCurrent();
    selectWeekNode(selectedWeekNode);
    toast(wData.done ? 'Week completed! Great momentum.' : 'Week reopened.');
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.done = !mData.done;
    saveCurrent();
    selectMonthChapter(selectedMonthIdx);
    toast(mData.done ? 'Month achieved! Outstanding progress.' : 'Month reopened.');
  }
};

function toast(s) {
  $('toast').textContent = s;
  $('toast').style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').style.display = 'none', 3200);
}


// Live Editing of Milestone Names & Objectives
$('point-name-input').oninput = () => {
  let val = $('point-name-input').value;
  if (isYearTarget()) {
    yearData[selectedYearIdx].customName = val;
    let effective = val.trim() || chapters[selectedYearIdx].name;
    $('biome').textContent = effective.toUpperCase();
    $('location').textContent = 'CHAPTER ' + String(selectedYearIdx + 1).padStart(2, '0') + ' · ' + effective.toUpperCase();
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.customName = val;
    let effective = val.trim() || (selectedWeekNode.monthName + ' Week ' + selectedWeekNode.weekNum);
    $('location').textContent = effective.toUpperCase();
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.customName = val;
    let effective = val.trim() || monthChapters[selectedMonthIdx].name;
    $('location').textContent = 'MONTH ' + String(selectedMonthIdx + 1).padStart(2, '0') + ' · ' + effective.toUpperCase();
    let mm = String(selectedMonthIdx + 1).padStart(2, '0');
    $('cal-link-text').textContent = 'Open ' + effective + ' ' + selectedYear + ' in Google Calendar ↗';
  }
  saveCurrent();
  renderNav();
};

$('point-title-input').oninput = () => {
  let val = $('point-title-input').value;
  if (isYearTarget()) {
    yearData[selectedYearIdx].customTitle = val;
    let effective = val.trim() || chapters[selectedYearIdx].title || getYearChapterName(selectedYearIdx);
    $('goal').textContent = effective;
    $('maptitle').textContent = effective;
  } else if (selectedWeekNode) {
    let wData = getWeekStorage(selectedYear, selectedWeekNode.mIndex, selectedWeekNode.weekNum);
    wData.customTitle = val;
    let effective = val.trim() || ('Week ' + selectedWeekNode.weekNum);
    $('goal').textContent = effective;
    $('maptitle').textContent = selectedWeekNode.monthName + ' · ' + effective;
  } else {
    let mData = getMonthStorage(selectedYear, selectedMonthIdx);
    mData.customTitle = val;
    let effective = val.trim() || monthChapters[selectedMonthIdx].title;
    let mName = getMonthChapterName(selectedYear, selectedMonthIdx);
    $('goal').textContent = effective;
    $('maptitle').textContent = mName + ' · ' + effective;
  }
  saveCurrent();
};

// Vision Image Handlers
// Multiple photo upload handler (years, months, weeks and days)
$('image-file-input').onchange = async e => {
    const files = Array.from(e.target.files || []);

    e.target.value = '';

    if (!files.length) return;

    try {
        if (isYearTarget()) {
            const added = await addYearGalleryFiles(selectedYearIdx, files);
            if (added) {
                toast(`${added} photo(s) added successfully!`);
                await refreshMainPointGallery(mainPointGallery.length);
            }
            return;
        }

        const spec = mainPointGallerySpec || currentPointGallerySpec();
        const result = await lqAddGalleryFiles(
            spec.db,
            spec.store,
            spec.prefix,
            files,
            mainPointGallery.length
        );

        if (result.added) {
            toast(`${result.added} photo(s) added successfully!`);
            if (spec.saveLegacy) spec.saveLegacy();
            await refreshMainPointGallery(mainPointGallery.length);
        }
    } catch (error) {
        alert('Could not upload photos: ' + error.message);
    }
};

$('toggle-url-btn').onclick = () => {
  let open = $('url-drawer').style.display !== 'none';
  $('url-drawer').style.display = open ? 'none' : 'block';
  if (!open) {
    $('img-url-input').value = '';
    $('img-url-input').focus();
  }
};

$('save-url-btn').onclick = () => {
  let url = $('img-url-input').value.trim();
  if (!url) {
    toast('Please enter an image link');
    return;
  }
  setImageForCurrentPoint(url);
  $('url-drawer').style.display = 'none';
  toast('Vision image link applied!');
};

$('cancel-url-btn').onclick = () => {
  $('url-drawer').style.display = 'none';
};

$('remove-img-btn').onclick = async () => {
    const entry = mainPointGallery[mainPointPhotoIndex];

    if (!entry) return;

    if (!confirm('Delete this photo?')) return;

    try {
        const oldIndex = mainPointPhotoIndex;

        if (isYearTarget()) {
            await deleteYearGalleryEntry(selectedYearIdx, entry);
        } else {
            const spec = mainPointGallerySpec || currentPointGallerySpec();

            if (entry.legacy) {
                spec.clearLegacy();
            } else if (entry.key) {
                await lqPhotoOp(spec.db, spec.store, 'delete', entry.key);
            }

            if (spec.saveLegacy) spec.saveLegacy();
        }

        await refreshMainPointGallery(
            Math.max(0, oldIndex - 1)
        );

        toast('Photo deleted successfully!');

    } catch (error) {
        alert('Could not delete photo: ' + error.message);
    }
};

// Previous photo
$('point-photo-prev').onclick = () => {
    if (mainPointGallery.length < 2) return;

    mainPointPhotoIndex =
        (mainPointPhotoIndex - 1 + mainPointGallery.length)
        % mainPointGallery.length;

    renderMainPointGallery();
};

// Next photo
$('point-photo-next').onclick = () => {
    if (mainPointGallery.length < 2) return;

    mainPointPhotoIndex =
        (mainPointPhotoIndex + 1)
        % mainPointGallery.length;

    renderMainPointGallery();
};

$('view-full-img-btn').onclick = $('point-img-element').onclick = () => {
  let src = $('point-img-element').src;
  if (!src) return;
  $('modal-img-display').src = src;
  $('image-modal').showModal();
};

$('close-image-modal').onclick = () => $('image-modal').close();
$('image-modal').onclick = e => {
  if (e.target === $('image-modal')) $('image-modal').close();
};

// Help & Controls
$('help').onclick = () => $('help-dialog').showModal();
$('close-help').onclick = $('start').onclick = () => $('help-dialog').close();

function updateViewButton() {
  $('overview').innerHTML = worldView ? 'âŒ– <span>Follow player</span>' : 'âŒ– <span>World view</span>';
}
$('overview').onclick = () => {
  worldView = !worldView;
  followingPlayer = !worldView;
  if (worldView) {
    targetCamX = W / 2;
    targetCamY = H / 2;
  } else {
    targetCamX = player.x;
    targetCamY = player.y - 80;
    clampCam();
  }
  updateViewButton();
};
$('recenter').onclick = () => {
  worldView = false;
  followingPlayer = true;
  targetCamX = player.x;
  targetCamY = player.y - 80;
  clampCam();
  updateViewButton();
  toast('Focused on your explorer');
  canvas.focus();
};

function typing(e) {
  return /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || $('help-dialog').open;
}

// Touch & Drag-to-Navigate Map
canvas.onpointerdown = e => {
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragCamStartX = camX;
  dragCamStartY = camY;
  dragDistance = 0;
  followingPlayer = false;
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  canvas.style.cursor = 'grabbing';
};

canvas.onpointermove = e => {
  let rect = canvas.getBoundingClientRect();
  let wx = (e.clientX - rect.left - w / 2) / scale + camX;
  let wy = (e.clientY - rect.top - h / 2) / scale + camY;

  if (isDragging) {
    let dx = (e.clientX - dragStartX) / scale;
    let dy = (e.clientY - dragStartY) / scale;
    dragDistance = Math.hypot(e.clientX - dragStartX, e.clientY - dragStartY);
    if (dragDistance > 4) {
      worldView = false;
      updateViewButton();
      targetCamX = dragCamStartX - dx;
      targetCamY = dragCamStartY - dy;
      clampCam();
      camX = targetCamX;
      camY = targetCamY;
    }
    canvas.style.cursor = 'grabbing';
  } else {
    let overItem = false;
    if (currentMode === 'years') {
      let overLandmark = chapters.some(c => Math.hypot(wx - c.x, (wy - c.y + 15) * .8) < 115);
      let overMonth = monthMarkers.some(m => Math.hypot(wx - m.x, wy - m.y) < 18);
      overItem = overLandmark || overMonth;
    } else {
      let overM = monthChapters.some(c => Math.hypot(wx - c.x, (wy - c.y + 15) * .8) < 115);
      let overW = weekStones.some(ws => Math.hypot(wx - ws.x, wy - ws.y) < 18);
      overItem = overM || overW;
    }
    canvas.style.cursor = overItem ? 'pointer' : 'grab';
  }
};

/* ===== MAP CLICK HANDLING ===== */

canvas.onpointerup = canvas.onpointercancel = e => {

    if (!isDragging) return;

    try {
        canvas.releasePointerCapture(e.pointerId);
    } catch (error) {}

    isDragging = false;
    canvas.style.cursor = 'grab';

    // Ignore dragging, handle only clicks
    if (dragDistance > 6) return;

    const rect = canvas.getBoundingClientRect();

    const x = (e.clientX - rect.left - w / 2) / scale + camX;
    const y = (e.clientY - rect.top - h / 2) / scale + camY;

    if (currentMode === 'years') {

        // Click a month marker to open Google Calendar
        const clickedMonth = monthMarkers.find(m =>
            Math.hypot(x - m.x, y - m.y) < 22
        );

        if (clickedMonth) {

            player.x = clickedMonth.roadX;
            player.y = clickedMonth.roadY;

            targetCamX = clickedMonth.roadX;
            targetCamY = clickedMonth.roadY;

            clampCam();
            followingPlayer = true;
            updateViewButton();

            const mm = String(clickedMonth.mIndex + 1).padStart(2, '0');

            const url = 'https://calendar.google.com/calendar/r/month/' +
                clickedMonth.year + '/' + mm + '/01';

            window.open(url, '_blank', 'noopener,noreferrer');

            return;
        }

        // Click yearly landmark to open Dream Mode
        const near = chapters.findIndex(c =>
            Math.hypot(x - c.x, (y - c.y + 15) * 0.8) < 115
        );

        if (near >= 0) {

            selectYearChapter(near, true);

            if (typeof openDreamScene === 'function') {
                openDreamScene(near);
            }
        }

    } else {

        // Click weekly stepping stone
        const nearWeek = weekStones.find(ws =>
            Math.hypot(x - ws.x, y - ws.y) < 20
        );

        if (nearWeek) {
            selectWeekNode(nearWeek);
            return;
        }

        // Click monthly landmark
        const nearMonth = monthChapters.findIndex(c =>
            Math.hypot(x - c.x, (y - c.y + 15) * 0.8) < 115
        );

        if (nearMonth >= 0) {
            selectMonthChapter(nearMonth, true);
        }
    }
};

canvas.onwheel = e => {
  e.preventDefault();
  worldView = false;
  followingPlayer = false;
  updateViewButton();
  targetCamY += e.deltaY / scale;
  clampCam();
  camY = targetCamY;
};

// Main Game Loop
function loop(now) {
  let dt = Math.min((now - last) / 1000 || 0, .035);
  last = now;

  scale = worldView ? Math.min(w / W, h / (H + 80)) : Math.max(.56, Math.min(.95, w / 690));

  if (worldView) {
    targetCamX = W / 2;
    targetCamY = H / 2;
  } else if (followingPlayer) {
    targetCamX = player.x;
    targetCamY = player.y - 80;
    clampCam();
  }

  if (!camY) {
    camX = targetCamX;
    camY = targetCamY;
  }

  if (!isDragging) {
    camX += (targetCamX - camX) * Math.min(1, dt * 8);
    camY += (targetCamY - camY) * Math.min(1, dt * 8);
  }

  // Adaptive HUD location based on center of view
  let viewX = isDragging ? camX : (followingPlayer ? player.x : camX);
  let viewY = isDragging ? camY : (followingPlayer ? player.y : camY);

  if (currentMode === 'years') {
    let nearCh = chapters.findIndex(c => Math.hypot(c.x - viewX, (c.y - viewY) * .8) < 130);
    if (nearCh >= 0) {
      $('location').textContent = 'YEAR ' + chapters[nearCh].year + ' · ' + getYearChapterName(nearCh).toUpperCase();
    } else {
      let nearMonth = monthMarkers.find(m => Math.hypot(m.roadX - viewX, m.roadY - viewY) < 45);
      if (nearMonth) {
        $('location').textContent = nearMonth.fullName.toUpperCase() + ' ' + nearMonth.year;
      }
    }
  } else {
    let nearM = monthChapters.findIndex(c => Math.hypot(c.x - viewX, (c.y - viewY) * .8) < 120);
    if (nearM >= 0) {
      $('location').textContent = 'MONTH ' + String(nearM + 1).padStart(2, '0') + ' · ' + monthChapters[nearM].name.toUpperCase();
    } else {
      let nearW = weekStones.find(ws => Math.hypot(ws.x - viewX, ws.y - viewY) < 55);
      if (nearW) {
        $('location').textContent = `${nearW.monthName.toUpperCase()} · WEEK 0${nearW.weekNum}`;
      }
    }
  }

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#172f26';
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-camX, -camY);

  drawTerrain(now);

  // Avatar
  let p = player;
  ellipse(p.x, p.y + 8, 17, 7, '#0a211c88');
  ctx.strokeStyle = '#f3d78b88';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 6, 25 + Math.sin(now / 300) * 3, 13, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#27392e';
  ctx.fillRect(p.x - 7, p.y - 3, 5, 12);
  ctx.fillRect(p.x + 3, p.y - 3, 5, 12);
  poly([[p.x - 10, p.y - 20], [p.x + 10, p.y - 20], [p.x + 12, p.y], [p.x - 12, p.y]], '#dcba72');
  ellipse(p.x, p.y - 27, 8, 9, '#e4bf8e');
  ellipse(p.x, p.y - 32, 10, 4, '#465943');
  ctx.fillStyle = '#746040';
  ctx.fillRect(p.x - 8, p.y - 16, 11, 14);

  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4dfaa';
  ctx.fillText('YOU', p.x, p.y - 48);

  ctx.restore();

  // Edge Vignette
  let grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#10251c88');
  grad.addColorStop(.2, '#10251c00');
  grad.addColorStop(.72, '#10251c00');
  grad.addColorStop(1, '#10251c88');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  requestAnimationFrame(loop);
}

// Initial Launch
rebuildRoadmapLayout();
refreshYearOptions();
renderNav();
selectYearChapter(0);
$('switch-years').textContent = 'My Roadmap';
$('switch-months').hidden = true;
$('year-select').hidden = true;
resize();
requestAnimationFrame(loop);



/* Daily Review Journal */
(() => {
  const storageKey = 'lifequest-daily-reviews-v1';

  const dialog = document.getElementById('daily-review-dialog');
  const dateInput = document.getElementById('review-date');
  const status = document.getElementById('review-status');

  const fieldIds = [
    'review-wins',
    'review-challenges',
    'review-lessons',
    'review-tomorrow'
  ];

  // Load previously saved reviews
  let reviews = {};

  try {
    reviews = JSON.parse(
      localStorage.getItem(storageKey) || '{}'
    ) || {};
  } catch {
    reviews = {};
  }

  // Format a date as YYYY-MM-DD
  function localDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  // Display the review for the selected date
  function showReview() {
    const entry = reviews[dateInput.value] || {};

    fieldIds.forEach(id => {
      document.getElementById(id).value = entry[id] || '';
    });

    status.textContent = reviews[dateInput.value]
      ? 'Review loaded. Changes save automatically.'
      : 'No review for this date yet. Changes save automatically.';
  }

  // Automatically save the review
  function saveReview() {
    const entry = {};

    fieldIds.forEach(id => {
      entry[id] = document.getElementById(id).value;
    });

    if (fieldIds.every(id => entry[id].trim() === '')) {
      delete reviews[dateInput.value];
    } else {
      reviews[dateInput.value] = entry;
    }

    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(reviews)
      );

      status.textContent = `Saved for ${dateInput.value} ✓`;
    } catch {
      status.textContent =
        'Could not save: browser storage is unavailable or full.';
    }
  }

  // Move to another day
  function changeDay(amount) {
    const [year, month, day] = dateInput.value
      .split('-')
      .map(Number);

    const date = new Date(year, month - 1, day, 12);

    date.setDate(date.getDate() + amount);
    dateInput.value = localDate(date);

    showReview();
  }

  // Open journal at today's date
  document.getElementById('review-open')
    .addEventListener('click', () => {
      dateInput.value = localDate(new Date());
      showReview();
      dialog.showModal();
    });

  // Close journal
  document.getElementById('review-close')
    .addEventListener('click', () => dialog.close());

  // Previous day
  document.getElementById('review-prev')
    .addEventListener('click', () => changeDay(-1));

  // Next day
  document.getElementById('review-next')
    .addEventListener('click', () => changeDay(1));

  // Select a date from the calendar
  dateInput.addEventListener('change', showReview);

  // Save whenever you type
  fieldIds.forEach(id => {
    document.getElementById(id)
      .addEventListener('input', saveReview);
  });
})();

/* =====================================
   MAP DAY / NIGHT MODE
   Keep this after the original Life Quest
   map and Daily Review code.
===================================== */
(() => {
    const game = document.querySelector('.game');
    const toggle = document.getElementById('theme-toggle');

    // If the optional button is not in HTML, the map still works.
    if (!game || !toggle) return;

    let mode = 'day';

    try {
        if (localStorage.getItem('lifequest-map-mode') === 'night') {
            mode = 'night';
        }
    } catch (error) {
        // Storage may be disabled; day mode still works.
    }

    function updateLighting() {
        const isNight = mode === 'night';
        game.classList.toggle('night-mode', isNight);
        toggle.textContent = isNight ? '☀️ Day' : '🌙 Night';
        toggle.setAttribute('aria-pressed', String(isNight));
        toggle.title = isNight ? 'Switch to day mode' : 'Switch to night mode';
    }


    

    toggle.addEventListener('click', () => {
        mode = mode === 'day' ? 'night' : 'day';
        updateLighting();

        try {
            localStorage.setItem('lifequest-map-mode', mode);
        } catch (error) {
            // The toggle continues to work without permanent storage.
        }
    });

    updateLighting();
})();



/* ===== FULL-SCREEN DREAM MODE ===== */

let activeDreamIndex = 0;

const dreamCaptions = {};


// Photo gallery state for the full-screen Dream Mode.
// This is separate from the year Previous / Next controls.
let dreamGallery = [];
let dreamPhotoIndex = 0;
let dreamGalleryToken = 0;

function renderDreamGallery() {
    const entry = dreamGallery[dreamPhotoIndex];
    const image = $('dream-photo');
    const empty = $('dream-empty');
    const nav = $('dream-photo-nav');
    const count = $('dream-photo-count');
    const previous = $('dream-photo-prev');
    const next = $('dream-photo-next');
    const dreamStage = document.querySelector('.dream-stage');

    if (!entry) {
        image.hidden = true;
        image.removeAttribute('src');
        empty.hidden = false;

        if (dreamStage) {
            dreamStage.style.setProperty('--dream-background', 'none');
        }
        if (nav) nav.hidden = true;
        return;
    }

    image.src = entry.src;
    image.hidden = false;
    empty.hidden = true;

    if (dreamStage) {
        dreamStage.style.setProperty('--dream-background', `url("${entry.src}")`);
    }

    if (nav) nav.hidden = false;

    if (count) {
        count.textContent =
            `${dreamPhotoIndex + 1} / ${dreamGallery.length}`;
    }

    if (previous) previous.hidden = dreamGallery.length < 2;
    if (next) next.hidden = dreamGallery.length < 2;
}

async function refreshDreamGallery(index, preferredIndex = 0) {
    const token = ++dreamGalleryToken;

    lqReleaseGallery(dreamGallery);
    dreamGallery = [];
    dreamPhotoIndex = 0;
    renderDreamGallery();

    let gallery = [];

    try {
        gallery = await readYearGallery(index);
    } catch (error) {
        console.error('Could not load year photos:', error);
    }

    if (token !== dreamGalleryToken) {
        lqReleaseGallery(gallery);
        return;
    }

    dreamGallery = gallery;
    dreamPhotoIndex = gallery.length
        ? Math.max(0, Math.min(preferredIndex, gallery.length - 1))
        : 0;

    renderDreamGallery();
}

// Open a dream in full-screen mode
function openDreamScene(index) {

    activeDreamIndex = (index + chapters.length) % chapters.length;

    if (currentMode === 'years' &&
        selectedYearIdx !== activeDreamIndex) {
        selectYearChapter(activeDreamIndex, true);
    }

    const milestone = chapters[activeDreamIndex];

    // Update text
    $('dream-year').textContent = milestone.year;

    $('dream-title').textContent =
        getYearChapterName(activeDreamIndex);

    $('dream-caption').textContent =
        dreamCaptions[milestone.year] || milestone.desc || 'Add a description to capture your vision.';

    // Open full-screen dialog
    if (!$('dream-dialog').open) {
        $('dream-dialog').showModal();
    }

    // Load this year's own photo gallery.
    refreshDreamGallery(activeDreamIndex, 0);
}


// Close dream
$('dream-close').onclick = () => {
    $('dream-dialog').close();
};


// Previous milestone
$('dream-prev').onclick = () => {
    openDreamScene(activeDreamIndex - 1);
};


// Next milestone
$('dream-next').onclick = () => {
    openDreamScene(activeDreamIndex + 1);
};


// Previous PHOTO inside the currently selected year
$('dream-photo-prev').onclick = () => {
    if (dreamGallery.length < 2) return;

    dreamPhotoIndex =
        (dreamPhotoIndex - 1 + dreamGallery.length)
        % dreamGallery.length;

    renderDreamGallery();
};


// Next PHOTO inside the currently selected year
$('dream-photo-next').onclick = () => {
    if (dreamGallery.length < 2) return;

    dreamPhotoIndex =
        (dreamPhotoIndex + 1)
        % dreamGallery.length;

    renderDreamGallery();
};


// Open file picker
$('dream-add-photo').onclick = () => {
    $('dream-file').click();
};


// Add multiple photos without replacing the existing ones
$('dream-file').onchange = async event => {

    const files = Array.from(event.target.files || []);

    event.target.value = '';

    if (!files.length) return;

    const index = activeDreamIndex;

    try {
        const added = await addYearGalleryFiles(index, files);

        if (added) {
            toast(`${added} photo(s) added successfully!`);
            await refreshDreamGallery(index, dreamGallery.length);
        }
    } catch (error) {
        alert('Could not save photos: ' + error.message);
    }
};


// Delete the photo currently shown in Dream Mode.
// viewer-layout.js uses this so its Delete button removes one photo only.
async function deleteCurrentDreamPhoto() {
    const entry = dreamGallery[dreamPhotoIndex];

    if (!entry) return;

    if (!confirm('Delete this photo?')) return;

    const index = activeDreamIndex;
    const oldIndex = dreamPhotoIndex;

    try {
        await deleteYearGalleryEntry(index, entry);
        await refreshDreamGallery(index, Math.max(0, oldIndex - 1));
        toast('Photo deleted successfully!');
    } catch (error) {
        alert('Could not delete photo: ' + error.message);
    }
}

window.LQDreamGallery = {
    deleteCurrent: deleteCurrentDreamPhoto,
    refresh: refreshDreamGallery
};


