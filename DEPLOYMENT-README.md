# Al Quranul Academy — Production Deployment Guide

This package is ready to deploy as-is to GitHub + Vercel (pure static site,
no build step). A few one-time setup steps happen outside the codebase, in
the Firebase Console and Google Apps Script editor — everything in the code
itself is already done.

## 1. Deploy the site
Push this folder to a GitHub repo and import it into Vercel as a static
site (Framework Preset: "Other" / no build command, output directory: `/`).
No environment variables are required — Firebase config is already embedded
in `js/firebase.js`, and everything else is static HTML/CSS/JS.

## 2. Firebase Console — one-time setup
Project: **al-quranul-academy**

- **Realtime Database → Rules** — paste in `database.rules.json` (already
  in this package). This allows public read access to courses/blog/notices,
  public *create-only* access to bookings, and restricts every write/update/
  delete to signed-in admins.
- **Storage → Rules** — paste in `storage.rules` (already in this package).
  Public read, admin-only upload, 8MB cap, images only. If Storage isn't
  enabled yet for this project, enable it first (Storage tab → Get Started).
- **Authentication → Sign-in method** — enable **Email/Password**.
- **Authentication → Users → Add user** — create one login per staff member
  who needs dashboard access. There is no public sign-up; accounts are
  created here only.

## 3. Google Apps Script — already deployed
Your Apps Script Web App URL is already wired into `free-trial.html`'s
`data-endpoint` attribute. If you ever need to redeploy `Code.gs` from
scratch:
1. Create/open the target Google Sheet → Extensions → Apps Script → paste
   in `Code.gs`.
2. Confirm `NOTIFY_EMAIL` at the top is the address that should receive
   booking notifications (currently `alquranulacademy@gmail.com`).
3. Deploy → New deployment → Web app → Execute as **Me**, Who has access
   **Anyone** → Deploy → copy the `/exec` URL.
4. Update the `data-endpoint` attribute in `free-trial.html` with the new URL.

## 4. Facebook Pixel — one placeholder left on purpose
`js/generate.py`'s `FB_PIXEL_ID` (and therefore every page's embedded Pixel
code) is still `"YOUR_PIXEL_ID_HERE"` — this can't be filled in
automatically because it depends on a Meta Business/Ads account only you
have access to. Get your Pixel ID from Meta Events Manager, then either:
- find-and-replace `YOUR_PIXEL_ID_HERE` across the 13 HTML files, or
- update `FB_PIXEL_ID` in `generate.py` and re-run `python3 build.py`.

## 5. Production domain — one placeholder left on purpose
`SITE_URL` in `generate.py` (used for canonical URLs, Open Graph tags, and
`sitemap.xml`) is a placeholder domain. Once your final production domain
is confirmed (custom domain or `*.vercel.app`), update `SITE_URL` and
re-run `python3 build.py && python3 build_seo.py` — or tell me the domain
and I'll do it for you.

## What's already verified working
Google Apps Script ↔ Google Sheets ↔ Gmail notifications, Firebase Auth,
Realtime Database (courses/blog/notices/bookings), Firebase Storage image
upload, Admin Login, full Admin Dashboard CRUD (Courses, Blog, Notices,
Bookings with search/status/export), responsive layout, SEO tags, and
accessibility — see the audit summary in chat for the full list of what
was checked and fixed.
