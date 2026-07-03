# backend/ — Firebase configuration & data tools

This project has **no server to run**. "Backend" here means the Firebase
project (Firestore database + Hosting) and Cloudinary account that the
`frontend/` and `admin/` static sites talk to directly from the browser.
This folder holds the configuration and one-time scripts for that backend
— it is not deployed as code itself.

```
backend/
├── firebase.json              Hosting + Firestore deploy config
├── .firebaserc                Which Firebase project/sites to deploy to
├── firestore/
│   ├── firestore.rules        Security rules (who can read/write what)
│   └── firestore.indexes.json Composite indexes (none needed yet)
└── seed/                      Optional one-time import of 303 sample products
    ├── products_seed.json
    ├── images/                 Sample product photos (for local upload only)
    ├── seed.js
    ├── package.json
    └── .env.example
```

## 1. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project** → follow the
   wizard (Google Analytics is optional).
2. In the project, open **Build → Firestore Database → Create database**.
   Choose **Production mode** and pick a region close to your customers
   (e.g. `asia-south1` for India).
3. Open **Build → Authentication → Get started → Sign-in method** and
   enable **Email/Password**.
4. Open **Authentication → Users → Add user** and create the admin login
   (the email + password you'll use to sign in to `admin/admin.html`).
   You control exactly who this is — there is no public sign-up form.

## 2. Get your web app config

1. Project settings (gear icon) → **General** → scroll to **Your apps** →
   click the `</>` (Web) icon → register an app (any nickname).
2. Copy the `firebaseConfig` object shown.
3. Paste those exact values into **both**:
   - `frontend/js/firebase-config.js`
   - `admin/js/firebase-config.js`

## 3. Deploy the security rules

The rules in `firestore/firestore.rules` do the following:
- Anyone can read a product only if it's marked `active: true` (hidden
  products don't leak to the public site).
- Only a signed-in user (your admin account) can create, edit, delete, or
  see hidden products.
- Anyone can *submit* an enquiry or newsletter signup (`create`), but only
  a signed-in admin can read or manage them — so strangers can't read
  other customers' phone numbers/emails.

Deploy them with the Firebase CLI (see step 5), or paste the contents of
`firestore.rules` into **Firestore Database → Rules** in the console and
click **Publish**.

## 4. Create your Cloudinary account & upload preset

1. Sign up free at https://cloudinary.com.
2. Dashboard home shows your **Cloud name** — copy it into:
   - `frontend/js/cloudinary-config.js` (`CLOUDINARY_CLOUD_NAME`)
   - `admin/js/cloudinary-config.js` (`CLOUDINARY_CLOUD_NAME`)
3. Go to **Settings (gear icon) → Upload → Upload presets → Add upload
   preset**.
   - Set **Signing Mode** to **Unsigned** (this is what lets the admin
     panel upload photos directly from the browser without exposing any
     secret key).
   - Optionally set a default folder, e.g. `thangamalar-products`.
   - Save, then copy the preset name into
     `admin/js/cloudinary-config.js` (`CLOUDINARY_UPLOAD_PRESET`).

That's the entire image pipeline: the admin panel uploads to Cloudinary
and stores the returned URL on the product's Firestore document; the
public site just displays that URL (with an on-the-fly Cloudinary resize
for fast-loading thumbnails).

## 5. Install the Firebase CLI and deploy

```bash
npm install -g firebase-tools
firebase login

cd backend
firebase use --add          # pick your Firebase project, alias it "default"

# create two Hosting sites inside your one Firebase project —
# one for the public site, one for the admin panel
firebase hosting:sites:create thangamalar-site
firebase hosting:sites:create thangamalar-admin

# wire each site to the matching "target" name used in firebase.json
firebase target:apply hosting frontend thangamalar-site
firebase target:apply hosting admin thangamalar-admin

# ship the security rules
firebase deploy --only firestore:rules

# ship both sites
firebase deploy --only hosting
```

Your public site will be live at `https://thangamalar-site.web.app` and
the admin panel at `https://thangamalar-admin.web.app` (or your own
custom domains, attached later under **Hosting → Add custom domain**).

Site IDs (`thangamalar-site`, `thangamalar-admin`) must be globally unique
across all of Firebase — if either name is taken, pick another and update
`.firebaserc` to match.

**Keeping the admin panel private:** anyone who finds the admin URL still
needs a valid Firebase Authentication login to see or change anything —
the Firestore rules in step 3 enforce that server-side, not just the
login screen. For extra obscurity you can also skip Firebase Hosting for
`admin/` and instead deploy it to a separate, unlisted Netlify/Vercel
project — the code doesn't care how it's hosted, only which Firebase
project it points to.

### Prefer Vercel or Netlify instead of Firebase Hosting?

Firestore and Cloudinary are called directly from the browser, so
`frontend/` and `admin/` are plain static sites — deploy them exactly like
any other static folder:
- **Vercel:** New Project → Root Directory `frontend` (and a second
  project with Root Directory `admin`) → no build command → Deploy.
- **Netlify:** Add new site → Deploy manually / connect repo → Base
  directory `frontend` (and a second site with base directory `admin`) →
  no build command → Deploy.

You only need Firebase itself for Firestore + Authentication either way;
`firebase deploy --only firestore:rules` (from step 5) still applies.

## 6. (Optional) Seed the 303 sample products

If you want to start from the original demo catalog instead of an empty
one:

```bash
cd backend/seed
npm install
cp .env.example .env
# edit .env: point FIREBASE_SERVICE_ACCOUNT_PATH at a service-account key
# (Project settings -> Service accounts -> Generate new private key),
# and optionally add your Cloudinary credentials so sample photos upload too
npm run seed
```

This is a local, one-time developer tool — it's never deployed and isn't
part of the live site. Safe to skip entirely and add your own products
from the admin panel instead.

## Data model

**`products` collection** — one document per item:

| field           | type      | notes                                   |
|-----------------|-----------|------------------------------------------|
| `code`          | string    | unique, e.g. `TM-G-R-051`                |
| `name`          | string    |                                           |
| `material`      | string    | `gold` \| `silver`                       |
| `type`          | string    | `ring` \| `necklace` \| `earring` \| `bracelet` \| `anklet` \| `gifts` |
| `description`   | string    |                                           |
| `badge`         | string    | optional, e.g. "Bestseller"              |
| `image`         | string    | Cloudinary secure URL                    |
| `imagePublicId` | string    | Cloudinary public ID (for reference)     |
| `active`        | boolean   | hide a product without deleting it       |
| `createdAt`/`updatedAt` | timestamp | set automatically              |

**`enquiries` collection** — every product enquiry and contact-form
submission is saved here (in addition to opening WhatsApp), so nothing is
lost if a customer closes WhatsApp before hitting send.

**`newsletter` collection** — email signups from the footer form.
