/* ═══════════════════════════════════════════════════════════════
   CLOUDINARY CONFIG — Thangamalar Jewellers (public site)
   ───────────────────────────────────────────────────────────────
   The public site only ever *displays* Cloudinary image URLs that
   are already stored in Firestore (written by the admin panel), so
   it does not need any upload credentials.

   CLOUD_NAME is only used to build lightweight, on-the-fly resized
   thumbnails via Cloudinary's URL transformation syntax — see
   cloudinaryThumb() in js/main.js.
═══════════════════════════════════════════════════════════════ */
const CLOUDINARY_CLOUD_NAME = "go7pldv9";
