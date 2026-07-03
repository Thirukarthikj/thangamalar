/**
 * One-time helper to load the 303 sample products into Firestore.
 *
 * This script is a local developer tool only — it is NOT part of the
 * website and is never deployed. Run it once from your own machine
 * after you've set up Firebase and Cloudinary, if you want to start
 * with sample data instead of an empty catalog.
 *
 * Setup:
 *   1. cd backend/seed
 *   2. npm install
 *   3. Copy .env.example to .env and fill in the values (see below).
 *   4. npm run seed
 *
 * Required .env values:
 *   FIREBASE_SERVICE_ACCOUNT_PATH   Path to a Firebase service-account
 *                                    JSON key (Firebase Console → Project
 *                                    settings → Service accounts →
 *                                    Generate new private key). Keep this
 *                                    file OUT of git (see .gitignore).
 *
 * Optional .env values (only needed if you want the sample photos
 * uploaded to Cloudinary too — otherwise products are created with an
 * empty image field and you can attach photos later from the admin panel):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   CLOUDINARY_FOLDER               Defaults to "thangamalar-products"
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const cloudinary = require('cloudinary').v2;

const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!SERVICE_ACCOUNT_PATH || !fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error('Missing or invalid FIREBASE_SERVICE_ACCOUNT_PATH in .env — see the comment at the top of seed.js.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(path.resolve(SERVICE_ACCOUNT_PATH))),
});
const db = admin.firestore();

const CLOUDINARY_ENABLED = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);
if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}
const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'thangamalar-products';

const IMAGES_DIR = path.join(__dirname, 'images');
const SEED_FILE = path.join(__dirname, 'products_seed.json');

async function uploadImageIfAvailable(imagePath) {
  if (!CLOUDINARY_ENABLED || !imagePath) return '';
  const filename = imagePath.split('/').pop();
  const localPath = path.join(IMAGES_DIR, filename);
  if (!fs.existsSync(localPath)) return '';
  try {
    const result = await cloudinary.uploader.upload(localPath, { folder: CLOUDINARY_FOLDER });
    return result.secure_url;
  } catch (err) {
    console.warn(`  ! Could not upload ${filename} to Cloudinary: ${err.message}`);
    return '';
  }
}

async function run() {
  const products = JSON.parse(fs.readFileSync(SEED_FILE, 'utf8'));
  console.log(`Loaded ${products.length} sample products.`);
  console.log(CLOUDINARY_ENABLED
    ? 'Cloudinary credentials found — sample photos will be uploaded.'
    : 'No Cloudinary credentials in .env — products will be created without photos.');

  const existingSnap = await db.collection('products').get();
  const existingCodes = new Set(existingSnap.docs.map((d) => d.data().code));

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    if (existingCodes.has(p.code)) {
      skipped++;
      continue;
    }
    const imageUrl = await uploadImageIfAvailable(p.image);
    await db.collection('products').add({
      code: p.code,
      name: p.name,
      material: p.material,
      type: p.type,
      description: p.description || '',
      badge: p.badge || '',
      image: imageUrl,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    created++;
    if (created % 25 === 0) console.log(`  ...${created} products created so far`);
  }

  console.log(`Done. Created ${created} products, skipped ${skipped} (already present by code).`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
