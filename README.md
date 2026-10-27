# SIC Logbook

A class logbook and student analytics app for teachers. Log points and attendance during each lesson, track homework, grade unit projects, and turn it all into scores, reports and charts — in English or 中文.

It is a single HTML file with no build tools, frameworks or server. Everything runs in the browser.

## Quick start

**On a computer:** open `docs/index.html` in Chrome or Edge. No internet or account needed.

**On GitHub Pages (phones and installing as an app):**
1. Push this repo to GitHub.
2. Settings → Pages → *Deploy from a branch* → branch `main`, folder `/docs`.
3. Open the Pages address on a phone and choose **Add to Home Screen**. After the first load it works offline.

On iPhone, use Safari and install to the Home Screen, otherwise iOS may clear stored data.

## Features

- **Lessons** — opens the class you are teaching now from your timetable; tap a category, then tap students to give points (students who already have that category are outlined with a count badge); tap a student with no category selected (or right-click / long-press) to see and adjust all their categories for the lesson; mark absences; homework switch; objective met; self-assessment; "what to improve next lesson" with *Did it / Not yet / Doesn't apply* follow-up; homework follow-up list for students who missed homework 2+ times in a row; one lesson per class per day (a second lesson needs confirming).
- **Assignments** — unit projects, worksheets and revision for one or more classes; due dates; unit projects graded 0–5 or 0–10 (out of 10 counts at half weight) and added to Reflection, a per-project deduction (−5 or 0) for no submission once checked.
- **Assessments** — Behaviour, Participation, Notebook and Reflection scores calculated from points (editable), midterm/final, letter grades, generated feedback, printable reports and spreadsheet export.
- **Reflection** — self-rating trend, average ratings, class climate, recent improvement notes, plans followed, Teaching Coach.
- **Students** — individual profile, whole-class table and charts, class comparison; every table sorts by clicking a column header.
- **Overview** — school summary, pacing across parallel classes, data check (admins), management PDF report by week or semester.
- **Setup** — teachers, classes, students, timetable, semester, admins, categories with weights, backups.
- **Calendar** — China's public holidays and make-up workdays are built in, with an *Extra days off* field for school closures.
- **Language** — full English and Simplified Chinese interface.

## Project structure

```
src/app.html              The app. Edit this.
standalone/
  shim.js                 Local data layer (IndexedDB + shared file sync)
  local.js                Offline feedback writer, coach, data card, folder backup
  sw.js, manifest.webmanifest, icon-*.png   Installable web app files
scripts/
  build.py                Builds docs/ from src/ + standalone/
  make_icons.py           Regenerates the icons (optional)
docs/                     Built standalone app, served by GitHub Pages
.github/workflows/build.yml   Checks the build and JavaScript syntax on every push
```

## Development

Edit `src/app.html` (and `standalone/*.js` for offline-only behaviour), then rebuild:

```sh
python scripts/build.py
```

Commit both your change and the updated `docs/`. The GitHub Action fails if `docs/` is out of date.

The translation table sits in its own small `<script>` so the main script stays compact.

## Data and privacy

- This repository contains **no student or school data**. `.gitignore` blocks backup and data files; keep it that way if the repo is public.
- Data never leaves the device unless you export it or use a shared file.
- Teacher identity is the name chosen on first use, so the app suits a small trusted group.

## Backups

- Setup → Backup → *Choose backup folder* (Chrome/Edge) saves a dated backup daily and keeps the last 30; or *Download backup* anywhere.

## License

[MIT](LICENSE)
