# Thangamalar Jewellers — Website

Rebuilt as a plain **HTML / CSS / JavaScript** project (no framework, no
build step, no npm-install-to-run-the-site) with **Firebase Firestore**
for data and **Cloudinary** for images — the same pattern used by the
`logesg-main` reference project this was modeled on.

```
thangamalar-jewellers/
├── frontend/            The public website — deploy this as your main site
│   ├── index.html
│   ├── css/style.css
│   ├── js/
│   │   ├── firebase-config.js     ← add your Firebase project keys here
│   │   ├── cloudinary-config.js   ← add your Cloudinary cloud name here
│   │   └── main.js
│   └── images/           Static site photography (logo, banners, etc.)
│
├── admin/                The product-management panel — deploy separately
│   ├── admin.html
│   ├── css/admin.css
│   ├── js/
│   │   ├── firebase-config.js     ← same values as frontend's copy
│   │   ├── cloudinary-config.js   ← add your Cloudinary upload preset here
│   │   └── admin.js
│   └── images/
│
└── backend/              Firebase/Firestore config + optional data tools
    ├── firebase.json
    ├── .firebaserc
    ├── firestore/firestore.rules
    ├── firestore/firestore.indexes.json
    └── seed/              Optional: one-time import of 303 sample products
```

Nothing here needs a Node/Express server, a database server, or a build
tool. `frontend/` and `admin/` are two independent static sites that talk
straight to Firebase and Cloudinary from the browser.

## Quick start

1. **Read `backend/README.md` first** — it walks through creating the
   Firebase project, Firestore database, admin login, Cloudinary account
   and upload preset, and filling in the config files. This is the only
   setup step; skipping it is the #1 cause of a blank product catalog.
2. Open `frontend/index.html` directly in a browser (or run any static
   file server, e.g. `npx serve frontend`) to preview the public site.
3. Open `admin/admin.html` the same way, log in with the admin account you
   created in Firebase Authentication, and add your products.
4. When ready to go live, follow the **deploy** steps in
   `backend/README.md` (Firebase Hosting, or Vercel/Netlify if you
   prefer).

## What changed from the original MongoDB/Express version

The original project used a Node/Express API with MongoDB and a
`multer`-based file upload, plus a hard-coded shared admin password sent
in a request header. This rebuild removes all of that:

| Before | After |
|---|---|
| Express + MongoDB API to serve/save products | Browser talks to Firestore directly |
| `multer` upload to local disk (wiped on every free-tier redeploy) | Browser uploads straight to Cloudinary (permanent, CDN-backed) |
| Shared `ADMIN_PASSWORD` in a request header (previously leaked in a committed `.env`) | Firebase Authentication — a real login, enforced by Firestore security rules, not just the login screen |
| One combined `frontend/` folder mixing HTML and 20MB of loose images at the root | `frontend/index.html`, `frontend/css/`, `frontend/js/`, `frontend/images/` cleanly separated |
| Admin UI served *by* the Express backend at `/admin` | Independent static `admin/` site, deployable on its own URL |
| Two case-mismatched image filenames (`bk2.PNG`, `ab1.JPG`, `cl3.PNG`, `cn1.PNG` referenced in CSS vs. actual lowercase files) — these 404 on any case-sensitive host (Linux servers, Firebase/Vercel/Netlify) even though they may have worked locally on Windows/Mac | Fixed: all CSS references now match the real, lowercase filenames |

## Before you go live — checklist

- [ ] `frontend/js/firebase-config.js` **and** `admin/js/firebase-config.js`
      both have your real Firebase project values (must match exactly).
- [ ] `frontend/js/cloudinary-config.js` and `admin/js/cloudinary-config.js`
      have your real Cloudinary cloud name.
- [ ] `admin/js/cloudinary-config.js` has your **unsigned** upload preset
      name (Cloudinary → Settings → Upload → Upload presets).
- [ ] You created at least one Firebase Authentication user — that's your
      admin login.
- [ ] `firebase deploy --only firestore:rules` has been run at least once
      (or you pasted `firestore.rules` into the Firestore console) —
      without this, the catalog will look empty because reads are denied.
- [ ] The WhatsApp number in `frontend/js/main.js` (`WHATSAPP_NUMBER`) is
      your real business number.
- [ ] Update the contact details, address, and Google Maps embed in
      `frontend/index.html` (Contact page section) if they've changed.

See `backend/README.md` for the full step-by-step setup and deployment
guide, including Firebase Hosting *and* Vercel/Netlify instructions.
