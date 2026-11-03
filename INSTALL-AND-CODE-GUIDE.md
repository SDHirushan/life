# Life Quest — Photo deletion, weekly/daily images, popup editor, Supabase Cloud

Based on the last corrected **LifeQuest-Week-Click-Fixed** project. The existing map, calendar links, dreams, milestones, and journal remain intact.

## What changed, exactly

1. **Delete photo**: `app.js` yearly Dream Mode gets a Delete Photo button from the new `viewer-layout.js`; `month-visions.js` adds `mv-delete` and deletes both IndexedDB and legacy monthly images; `custom-milestones.js` adds `extra-remove-photo`; `hierarchy.js` adds `hq-photo-delete` for week/day and `hq-goal-image-delete` for extra weekly/daily milestones.
2. **Week/day images**: already supported by the original `hierarchy.js` through `hq-upload-btn`, `hq-upload`, and `photoOp('put', nodes[selected].id, file)`. These files are stored by distinct `week:YYYY-MM-NN` and `day:YYYY-MM-DD` keys. The updated `hierarchy.js` adds a separate `✎` edit button for each week/day beside the list, so a week can be edited without opening its days.
3. **No right sidebar**: `viewer-layout.js` moves the existing `#hq-panel` into `#hq-editor-dialog`, preserving existing listeners. `hierarchy.css` changes the map layout to two columns and styles the dialog. Use the **Edit week/day** button to change quests, photos, titles, notes, and achievements.
4. **Private cloud**: `cloud-sync.js` + `cloud-config.js` connect with Supabase Auth, Postgres (`lifequest_snapshots` JSONB) and a **private** Storage bucket (`lifequest-photos`). It saves existing localStorage milestone data and the full-resolution images from the three Life Quest IndexedDB stores. Uses explicit **Save to Cloud** and **Restore from Cloud** controls to avoid silently overwriting devices.

## Install the complete version (recommended)

1. **Back up your current project folder and browser data.** This ZIP includes a full, matched set. Use the same browser / URL to preserve saved data.
2. Extract ZIP into the existing Life Quest project folder. The filenames must be exactly `index.html`, `style.css`, `app.js`, `custom-milestones.js`, `month-visions.js`, `hierarchy.js`, `hierarchy.css`, `viewer-layout.js`, `cloud-config.js`, `cloud-sync.js`.
3. `index.html` includes this exact order, at the end before `</body>`:

```html
<script src="app.js?v=20261024_04"></script>
<script src="custom-milestones.js?v=3"></script>
<script src="month-visions.js?v=1"></script>
<script src="hierarchy.js?v=3"></script>
<script src="viewer-layout.js?v=1"></script>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="cloud-config.js"></script>
<script src="cloud-sync.js?v=1"></script>
```

`index.html` also loads `<link rel="stylesheet" href="hierarchy.css?v=3">` in `<head>`.

4. Open Life Quest and test the original yearly map, **Weeks**, **Days**, and **Edit week/day**. All of these work locally even if you haven't set up the cloud yet.

## Cloud database setup (required only for Feature 4)

1. Create a Supabase project at https://supabase.com/dashboard.
2. Open Supabase **SQL Editor** and execute **supabase-setup.sql once**. This creates a single per-user snapshot table, enables Row Level Security (RLS), and creates a private photo bucket with access limited to each signed-in user.
3. Find your project URL and the **publishable key** in Supabase API settings. In `cloud-config.js`, replace the placeholders:

```js
window.LIFEQUEST_CLOUD_CONFIG = {
  url: 'https://YOUR-PROJECT.supabase.co',
  publishableKey: 'YOUR-PUBLISHABLE-KEY'
};
```

Never put a Supabase secret key, `service_role` key, or database password in HTML/JS.

4. Open the page. Click **☁ Cloud**, then **Create account** and confirm your email if prompted; **Sign in**; click **Save to Cloud**. On another device, use the same account, then click **Restore from Cloud**.
5. Synchronization is **manual in this version**. Save after changing data; restore on the other device **before editing there** to avoid overwriting newer work. The Restore action is destructive to the local browser's current data, with a confirmation prompt.
6. Use VS Code Live Server (or a hosted HTTPS page) for reliable cloud usage. **`file:///...` and `http://localhost:5500` are different storage origins:** data saved under one will not be visible under the other. Cloud backup (from the original origin) or exporting browser data is necessary when changing origins.
7. Large images may exceed your Supabase project's individual upload/bucket limits. The cloud UI reports errors rather than claiming a backup succeeded.

## How to edit code manually instead of replacing files

- **`hierarchy.js`:** inside the `hq-photo-actions` HTML, add `<button id="hq-photo-delete" type="button" hidden>🗑 Delete photo</button>` and call `photoOp('delete', nodes[selected].id)` then `loadPhoto()`. Inside the extra milestone editor add a similar goal-image deletion button calling `photoOp('delete', 'goal:'+item.id)`.
- **`month-visions.js`:** add `<button id="mv-delete">🗑 Delete photo</button>` inside `.mv-actions`; extend `imageDB` with `store.delete(key)`, and delete the old `getMonthStorage(year,month).image` value too.
- **`custom-milestones.js`:** add `<button id="extra-remove-photo">🗑 Delete photo</button>` beside `#extra-edit`; its handler calls `photoStore('delete',viewingID)` and updates `hasPhoto`.
- **`viewer-layout.js`:** add as a **new separate script after `hierarchy.js`**, not by replacing `app.js` or `hierarchy.js`. It moves the existing editor panel into a modal and adds the original year's Delete Photo button. CSS overrides are in `hierarchy.css`.
- **`cloud-sync.js`:** add after the official Supabase CDN script and `cloud-config.js`. Don't instantiate Supabase with a secret key.

## Testing / limitations

- All local JavaScript passes `node --check`.
- Using an isolated Chromium document, verified Year map loads; opening a Week Road; opening the week/day editor; jumping into the Day Road; editing a daily quest; and presence of all photo-delete buttons. No runtime JavaScript errors in this smoke test.
- The test environment blocked normal local-host/file page navigation, and it cannot connect to your private Supabase project. **Live Supabase authentication, upload/restore, and persistence after a real browser reload need user testing after setup.**
