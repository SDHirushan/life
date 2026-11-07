/* User-managed years for the single year/month roadmap. */
(() => {
  'use strict';

  const addButton = document.getElementById('add-year');
  const earlierButton = document.getElementById('add-earlier-year');
  const laterButton = document.getElementById('add-later-year');
  const beforeWrap = document.getElementById('roadmap-before-wrap');
  const afterWrap = document.getElementById('roadmap-after-wrap');

  const dialog = document.createElement('dialog');
  dialog.className = 'roadmap-year-dialog';
  dialog.setAttribute('aria-labelledby', 'roadmap-year-heading');
  dialog.innerHTML = `
    <form id="roadmap-year-form">
      <button type="button" class="close" id="roadmap-year-close" aria-label="Close">×</button>
      <h2 id="roadmap-year-heading">Add a year</h2>
      <p>Creating a year also adds January through December to your main road.</p>
      <label for="roadmap-year-number">Year</label>
      <input id="roadmap-year-number" type="number" min="1900" max="2200" required>
      <label for="roadmap-year-name">Year name</label>
      <input id="roadmap-year-name" maxlength="90" placeholder="Give this year a name">
      <label for="roadmap-year-title">Main objective</label>
      <input id="roadmap-year-title" maxlength="120" placeholder="What do you want to achieve this year?">
      <label for="roadmap-year-description">Description</label>
      <textarea id="roadmap-year-description" rows="4" placeholder="Describe your year"></textarea>
      <div class="roadmap-year-actions">
        <button type="button" id="roadmap-year-cancel">Cancel</button>
        <button type="submit" class="primary">Create year and months</button>
      </div>
      <p id="roadmap-year-error" role="alert"></p>
    </form>`;
  document.body.appendChild(dialog);

  const css = document.createElement('style');
  css.textContent = `
    .roadmap-year-dialog{width:min(92vw,520px);max-width:520px;max-height:88dvh;overflow:auto}
    .roadmap-year-dialog h2{margin-top:0;color:#e5c784}
    .roadmap-year-dialog label{display:block;margin:14px 0 6px;color:#e5c784;font-size:12px}
    .roadmap-year-dialog input,.roadmap-year-dialog textarea{box-sizing:border-box;width:100%;padding:11px;background:#0b1c14;color:#fff;border:1px solid #49654d;border-radius:7px;font:inherit}
    .roadmap-year-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
    .roadmap-year-actions .primary{width:auto;margin:0}
    #roadmap-year-error{color:#ffc4b8;min-height:1em}
    #add-year{white-space:nowrap;color:#17251b;background:#e5c784;border-color:#e5c784;font-weight:700}
    #add-year:hover{background:#f0d79e;color:#17251b}
    .roadmap-edge-control{margin:7px 0}
    .roadmap-edge-control button{width:100%;text-align:left;font-size:10px;color:#c4d2bd;background:#17271f;border-style:dashed;padding:8px 10px}
    .roadmap-edge-control button:disabled{opacity:.45;cursor:not-allowed}
    .chapter-row{display:flex;align-items:center;gap:4px;min-width:0;flex:0 0 auto}
    .chapter-row>.chapter{flex:1;min-width:0;width:auto}
    .chapter-delete{flex-shrink:0;padding:6px 7px;color:#ffd4ca;background:#39221e;border-color:#8f554b;font-size:9px}
    .chapter-delete:hover{border-color:#ff9b8a;color:#fff}
  `;
  document.head.appendChild(css);

  document.getElementById('switch-years').textContent = 'My Roadmap';
  document.getElementById('switch-months').hidden = true;
  document.getElementById('year-select').hidden = true;
  document.querySelector('.roadmap-switcher').hidden = true;
  const mapLabel = document.getElementById('region-tag');
  if (mapLabel) mapLabel.innerHTML = 'MY ROADMAP<small id="location">YOUR YEARS AND MONTHS</small>';

  if (!window.LQRoadmap) {
    addButton.disabled = true;
    if (earlierButton) earlierButton.disabled = true;
    if (laterButton) laterButton.disabled = true;
    console.error('The roadmap data model did not load.');
    return;
  }

  const field = id => dialog.querySelector(`#${id}`);
  function updateEdgeButtons() {
    const hasYears = window.LQRoadmap.hasYears;
    beforeWrap.hidden = !hasYears;
    afterWrap.hidden = !hasYears;
    earlierButton.disabled = !hasYears || window.LQRoadmap.firstYear <= 1900;
    laterButton.disabled = !hasYears || window.LQRoadmap.lastYear >= 2200;
  }

  function open(position = 'any') {
    dialog.querySelector('#roadmap-year-form').reset();
    const firstYear = window.LQRoadmap.firstYear;
    const lastYear = window.LQRoadmap.lastYear;
    let suggestedYear = window.LQRoadmap.nextYear || new Date().getFullYear();
    if (position === 'earlier' && firstYear !== null) suggestedYear = firstYear - 1;
    if (position === 'later' && lastYear !== null) suggestedYear = lastYear + 1;
    field('roadmap-year-number').value = suggestedYear;
    dialog.querySelector('#roadmap-year-heading').textContent = position === 'earlier' && firstYear !== null
      ? `Add a year before ${firstYear}`
      : position === 'later' && lastYear !== null
        ? `Add a year after ${lastYear}`
        : 'Add a year';
    field('roadmap-year-error').textContent = '';
    dialog.showModal();
    field('roadmap-year-number').focus();
  }

  addButton.addEventListener('click', () => open());
  earlierButton.addEventListener('click', () => open('earlier'));
  laterButton.addEventListener('click', () => open('later'));
  window.addEventListener('lifequest:roadmap-change', updateEdgeButtons);
  dialog.querySelector('#roadmap-year-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('#roadmap-year-cancel').addEventListener('click', () => dialog.close());
  dialog.querySelector('#roadmap-year-form').addEventListener('submit', event => {
    event.preventDefault();
    try {
      window.LQRoadmap.addYear({
        year: field('roadmap-year-number').value,
        name: field('roadmap-year-name').value,
        title: field('roadmap-year-title').value,
        description: field('roadmap-year-description').value
      });
      dialog.close();
    } catch (error) {
      field('roadmap-year-error').textContent = error.message;
    }
  });

  async function migrateLegacyCustomYears() {
    const migrationKey = 'lifequest-user-roadmap-migrated-v1';
    if (localStorage.getItem(migrationKey) === 'true' || window.LQRoadmap.hasYears) return;

    let legacyItems = [];
    try {
      const value = JSON.parse(localStorage.getItem('lifequest-custom-milestones-v1') || '[]');
      if (Array.isArray(value)) legacyItems = value;
    } catch (error) {
      console.warn('Previously saved custom milestones could not be read.', error);
    }

    const grouped = new Map();
    legacyItems.forEach(item => {
      const year = Number(item?.year);
      if (!Number.isInteger(year) || year < 1900 || year > 2200) return;
      if (!grouped.has(year)) grouped.set(year, []);
      grouped.get(year).push(item);
    });

    if (!grouped.size) {
      localStorage.setItem(migrationKey, 'true');
      return;
    }

    let lastYear = null;
    for (const [year, items] of [...grouped.entries()].sort((a, b) => a[0] - b[0])) {
      const first = items[0];
      const tasks = items.slice(1).map(item => ({
        text: [item.name, item.description].filter(Boolean).join(': '),
        done: Boolean(item.done)
      }));
      try {
        window.LQRoadmap.addYear({
          year, name: first.name, description: first.description,
          done: Boolean(first.done), hasGalleryPhotos: items.some(item => item.hasPhoto),
          tasks, silent: true
        });
        lastYear = year;
      } catch (error) {
        console.warn(`Could not migrate the saved ${year} milestone.`, error);
        continue;
      }

      for (const item of items) {
        try {
          const prefix = `year-gallery:${year}:legacy-${item.id}`;
          const primary = await window.LQPhotos.op('lifequest-custom-photos', 'photos', 'get', item.id);
          if (primary instanceof Blob) {
            await window.LQPhotos.op('lifequest-hierarchy-photos-v1', 'photos', 'put', prefix, primary);
          }
          const extras = await window.LQPhotos.op('lifequest-custom-photos', 'photos', 'list', `gallery:${item.id}:`);
          for (let index = 0; index < extras.length; index++) {
            const photo = extras[index];
            if (photo.blob instanceof Blob) {
              await window.LQPhotos.op('lifequest-hierarchy-photos-v1', 'photos', 'put', `${prefix}-${index + 1}`, photo.blob);
            }
          }
        } catch (error) {
          console.warn(`A saved picture for ${year} could not be moved.`, error);
        }
      }
    }

    if (lastYear !== null) window.LQRoadmap.selectYear(lastYear);
    localStorage.setItem(migrationKey, 'true');
  }

  migrateLegacyCustomYears();
  updateEdgeButtons();
})();
