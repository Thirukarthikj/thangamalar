/* ═══════════════════════════════════════════════════════════════
   CLOUDINARY CONFIG — Thangamalar Jewellers (admin panel)
   ───────────────────────────────────────────────────────────────
   The admin panel uploads product photos straight from the browser
   to Cloudinary using an UNSIGNED upload preset. This is the
   Cloudinary-recommended way to upload from client-side code:
   no API secret is ever shipped to the browser, so nothing sensitive
   can leak if someone views source or inspects network requests.

   Setup (Cloudinary dashboard → Settings → Upload → Upload presets):
     1. Click "Add upload preset".
     2. Set "Signing Mode" to "Unsigned".
     3. (Recommended) Set a folder, e.g. "thangamalar-products".
     4. Save, then copy the preset name below.

   CLOUD_NAME: Cloudinary dashboard → Settings → top of the page.
═══════════════════════════════════════════════════════════════ */
const CLOUDINARY_CLOUD_NAME = "go7pldv9";
const CLOUDINARY_UPLOAD_PRESET = "thangamalar";
const CLOUDINARY_FOLDER = "thangamalar-products";
