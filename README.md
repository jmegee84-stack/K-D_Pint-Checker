# K&D Beer Fest - Pint Guide

Mobile web app for a beer festival. Browse the beers, then sign in to rate each one on price, taste, a Proper Pint Score out of 10 (empty glass to full glass) and the best serving size. Sign-ups and ratings collect in Supabase and sync to a Google Sheet.

- `index.html`, `config.js`: the website (static, hosted on GitHub Pages)
- `beers.json`: the beer list. Build it from a CSV with `tools/csv_to_beers.py`
- `images/`: beer photos and brewery logos
- `supabase/schema.sql`: database tables and privacy rules
- `apps-script/Code.gs`: Google Sheet sync

Start with **SETUP.md**. Until `config.js` is filled in, the site runs in a local-only demo mode where ratings stay on the phone.
