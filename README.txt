LIFE QUEST — 2026-10-27 FEATURE UPGRADE

Open INSTALL-AND-CODE-GUIDE.md for exact instructions.

Features:
- Delete picture for yearly visions, custom milestones, month visions,
  individual weeks, individual days, and extra weekly/daily milestones.
- Photo upload is independently stored for each week and each day.
- Week/day right panel becomes a popup opened with "Edit week / day".
- Supabase Cloud: account sign-in, private cloud SAVE + RESTORE including photos.
- Saved photos are hidden until a Supabase sign-in is confirmed; signing out keeps the browser copies.

To install: first back up your local project and browser data.
Extract these application files into the same Life Quest project folder.
Open index.html. Local features work without any cloud credentials.

To enable cloud: run supabase-setup.sql once in your Supabase SQL Editor;
then edit cloud-config.js with your project URL and publishable key.
Never put secret or service role keys into frontend files.

Testing: syntax checks passed; in isolated Chromium, year/map UI, weeks and days,
week-specific editor, daily quest edit, and mobile navigation showed no JS errors.
Cannot test private Supabase connectivity without your credentials.
