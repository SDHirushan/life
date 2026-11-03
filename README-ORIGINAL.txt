LIFE QUEST — YEAR → MONTH → WEEK → DAY EDITION
===============================================

FILES
  index.html
  style.css
  app.js
  custom-milestones.js
  month-visions.js
  hierarchy.css       [new]
  hierarchy.js        [new]

HOW TO START
  1. Extract the ZIP into one folder, keeping all seven files together.
  2. Open index.html in your browser, or open it via VS Code Live Server.
  3. Do not move just one JavaScript file to an old project folder: all files
     here are matched versions and must be kept together.

HOW TO USE THE MAP
  YEAR MAP:
    Click a year landmark or sidebar entry to see its cinematic dream picture.
    Press 'Explore this year' to enter that year's 12-month road.
    Click a roadside month label to enter its year's month map.
    Existing custom-year milestones can also open that year's month road.

  MONTH MAP:
    Click a month landmark or a month sidebar entry to enter its Week Road.
    Click a small numbered week stepping stone to go straight to that week's
    Day Road. Use 'Month Vision' for month photos and Google Calendar.

  WEEK ROAD:
    The week landmarks follow the real calendar (Monday-Sunday). Some months
    have 4, 5 or 6 rows. Select the week and use 'Explore days', or click
    the illustrated week landmark to enter its Day Road.
    Each week has an editable title, objective, quests, extra milestones,
    field notes, high-resolution photo, completion toggle and calendar link.

  DAY ROAD:
    Click a day landmark to edit its goals, add quests or extra milestones,
    attach a photo, mark completion, and open that date in Google Calendar.
    'Write Daily Review' opens your existing journal at the selected date.
    Partial calendar weeks show only days belonging to the chosen month.

  BREADCRUMBS & BACK:
    Use 'Years', 'Months', 'Weeks', Back or Close to navigate safely.
    'World view' zooms out to show the entire week/day road.

DATA & BACKUPS — IMPORTANT
  This version preserves the *names* of the original app's storage keys:
   - lifequest-v1                   (yearly quests / images)
   - lifequest-custom-milestones-v1 (custom year milestones)
   - lifequest-annual-v1            (months)
   - lifequest-annual-weeks-v1      (older weekly notes)
   - lifequest-daily-reviews-v1     (journal)
   - lifequest-month-vision-images  (monthly photos in IndexedDB)
   - lifequest-custom-photos        (custom photos in IndexedDB)
  New hierarchy text data: lifequest-hierarchy-v1 (localStorage)
  New hierarchy images:    lifequest-hierarchy-photos-v1 (IndexedDB)

  Browser data is NOT included in the ZIP and does NOT sync across devices.
  Back up your important journal entries and original dream photos separately.
  IMPORTANT: Changing from a file:// URL to a http://localhost URL can change
  the browser's storage origin and may make old data appear missing. Keep the
  same launch method/origin when testing your previous saved progress.

TESTS
  All four JavaScript files passed `node --check` syntax validation.
  The built project also passed isolated headless Chromium UI checks for:
    * first paint and rendered original year map
    * year Dream Mode -> selected 12-month map
    * sidebar month -> week map -> day map
    * day quests, edit titles and extra milestones
    * completion toggle, correct dated Daily Review, back navigation
    * chronological week boundaries, Feb 2028 leap day, six-row months
    * future year selection and mobile-width rendering
  The testing browser forbids navigating directly to local files/localhost.
  We exercised the same scripts in an isolated browser document instead.
  Photos in persistent IndexedDB and real external Calendar navigation must
  be verified in your own browser — they were not end-to-end tested here.

WEEK CLICK FIX — REVISION 2
  Fixed a camera variable collision in hierarchy.js. The original monthly
  map and the new week/day map previously both used a local `camY` name.
  As a result, clicking a small weekly stone could select the wrong month
  or appear to do nothing. The week/day map now uses `hqCamY` separately.
  index.html requests hierarchy.js?v=2 to bypass stale browser cache.

  Tested in an isolated Chromium document using actual pointer clicks:
    - W1, W2, W3 and W4 on the original monthly map -> corresponding day maps
    - Month sidebar -> weekly map
    - Week sidebar and week-road canvas -> daily map
    - Daily quests and completion status
    - Six-week months and February 29 of leap years
    - No uncaught JavaScript errors in these checks
