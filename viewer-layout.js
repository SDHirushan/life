/* Life Quest UI upgrade — keeps original data, map, and event handlers. */
(() => {
  'use strict';
  const overlay = document.getElementById('hq-overlay');
  if (!overlay) return;
  const panel = overlay.querySelector('#hq-panel');
  const header = overlay.querySelector('.hq-header');
  if (!panel || !header) return;

  // Move, never clone: hierarchy.js keeps its existing input listeners.
  const dialog = document.createElement('dialog');
  dialog.id = 'hq-editor-dialog';
  dialog.setAttribute('aria-label','Edit week or day goals and photos');
  const heading = document.createElement('div');
  heading.className = 'hq-editor-top';
  heading.innerHTML = '<strong>✎ Week / Day Details</strong><button type="button" id="hq-editor-close">✕ Close</button>';
  dialog.append(heading, panel);
  overlay.append(dialog);

  const edit = document.createElement('button');
  edit.id = 'hq-edit-stop';
  edit.type = 'button';
  edit.textContent = '✎ Edit week / day';
  header.insertBefore(edit, overlay.querySelector('#hq-back'));
  edit.addEventListener('click', () => {
    if (!overlay.hidden && !dialog.open) dialog.showModal();
  });
  heading.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  for (const id of ['hq-exit','hq-back']) {
    overlay.querySelector('#'+id)?.addEventListener('click', () => {
      if (dialog.open) dialog.close();
    }, {capture:true});
  }

  // Add "Delete photo" to the original yearly Dream Mode.
  const actions = document.querySelector('.dream-controls');
  if (actions && !document.getElementById('dream-delete-photo')) {
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.id = 'dream-delete-photo';
    remove.textContent = '🗑 Delete photo';
    actions.append(remove);
    remove.addEventListener('click', () => {
      if (typeof activeDreamIndex !== 'number' || !yearData[activeDreamIndex]?.image) return;
      if (!confirm('Delete this year\'s vision photo?')) return;
      const idx = activeDreamIndex;
      const old = yearData[idx].image;
      delete yearData[idx].image;
      try {
        localStorage.setItem('lifequest-v1', JSON.stringify(yearData));
      } catch (err) {
        yearData[idx].image = old;
        alert('Could not save deletion: ' + err.message);
        return;
      }
      if (currentMode === 'years' && selectedYearIdx === idx) updateImageUI('');
      openDreamScene(idx);
    });
  }
})();
