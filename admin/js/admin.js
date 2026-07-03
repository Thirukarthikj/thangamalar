/* ═══════════════════════════════════════════════════════════════
   THANGAMALAR JEWELLERS — ADMIN PANEL LOGIC
   Auth: Firebase Authentication (email/password)
   Data: Firebase Firestore ("products" collection)
   Images: uploaded straight from the browser to Cloudinary
═══════════════════════════════════════════════════════════════ */

let products = [];
let currentUploadedImage = null; // { url, publicId } for the pending form image

/* ═══════════════════════════════════════
   AUTH
═══════════════════════════════════════ */
function login() {
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const errEl = document.getElementById('loginError');
  errEl.style.display = 'none';

  if (!email || !password) {
    errEl.textContent = 'Please enter your email and password.';
    errEl.style.display = 'block';
    return;
  }

  auth.signInWithEmailAndPassword(email, password).catch((err) => {
    errEl.textContent = 'Login failed: ' + (err.message || 'Incorrect email or password.');
    errEl.style.display = 'block';
  });
}

function logout() {
  auth.signOut();
}

auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    loadProducts();
  } else {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('appScreen').style.display = 'none';
  }
});

/* ═══════════════════════════════════════
   LOAD + RENDER
═══════════════════════════════════════ */
async function loadProducts() {
  try {
    const snapshot = await db.collection('products').get();
    products = snapshot.docs.map((doc) => Object.assign({ id: doc.id }, doc.data()));
    renderGrid();
  } catch (err) {
    console.error('Failed to load products:', err);
    document.getElementById('grid').innerHTML = '<div class="empty">Could not load products. Check your Firebase config and Firestore rules.</div>';
  }
}

function renderGrid() {
  const grid = document.getElementById('grid');
  const search = document.getElementById('searchInput').value.toLowerCase();
  const material = document.getElementById('materialFilterAdmin').value;
  const type = document.getElementById('typeFilterAdmin').value;

  const filtered = products.filter((p) => {
    const matMatch = material === 'all' || p.material === material;
    const typeMatch = type === 'all' || p.type === type;
    const searchMatch = !search ||
      (p.name || '').toLowerCase().includes(search) ||
      (p.code || '').toLowerCase().includes(search);
    return matMatch && typeMatch && searchMatch;
  });

  document.getElementById('countLabel').textContent = `${filtered.length} of ${products.length} products`;

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty">No products found.</div>';
    return;
  }

  grid.innerHTML = filtered.map((p) => `
    <div class="card ${p.active === false ? 'inactive' : ''}">
      <img src="${cloudinaryThumb(p.image, 400)}" alt="${escapeHtml(p.name)}" onerror="this.src='https://placehold.co/300x300?text=No+Image'">
      <div class="body">
        <div class="code">${escapeHtml(p.code)}${p.active === false ? '<span class="badge-pill">Hidden</span>' : ''}</div>
        <div class="name">${escapeHtml(p.name)}</div>
        <div class="meta">${p.material} &middot; ${p.type}</div>
        <div class="actions">
          <button class="secondary" onclick='openForm(${JSON.stringify(p.id)})'>Edit</button>
          <button class="danger" onclick='deleteProduct(${JSON.stringify(p.id)})'>Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function cloudinaryThumb(url, width) {
  if (!url || typeof url !== 'string') return 'https://placehold.co/300x300?text=No+Image';
  if (url.indexOf('res.cloudinary.com') === -1 || url.indexOf('/upload/') === -1) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto,c_fill,w_' + (width || 400) + '/');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/* ═══════════════════════════════════════
   FORM (ADD / EDIT)
═══════════════════════════════════════ */
function openForm(id) {
  document.getElementById('formError').style.display = 'none';
  document.getElementById('formBackdrop').style.display = 'flex';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('f_image').value = '';
  document.getElementById('uploadProgress').style.display = 'none';
  currentUploadedImage = null;

  if (id) {
    const p = products.find((x) => x.id === id);
    document.getElementById('formTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = p.id;
    document.getElementById('f_code').value = p.code || '';
    document.getElementById('f_name').value = p.name || '';
    document.getElementById('f_material').value = p.material || 'gold';
    document.getElementById('f_type').value = p.type || 'ring';
    document.getElementById('f_badge').value = p.badge || '';
    document.getElementById('f_description').value = p.description || '';
    document.getElementById('f_active').checked = p.active !== false;
    if (p.image) {
      document.getElementById('imgPreview').src = cloudinaryThumb(p.image, 400);
      document.getElementById('imgPreview').style.display = 'block';
      currentUploadedImage = { url: p.image, publicId: p.imagePublicId || '' };
    }
  } else {
    document.getElementById('formTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('f_active').checked = true;
  }
}

function closeForm() {
  document.getElementById('formBackdrop').style.display = 'none';
}

function previewImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const preview = document.getElementById('imgPreview');
  preview.src = URL.createObjectURL(file);
  preview.style.display = 'block';
  uploadToCloudinary(file);
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const progressWrap = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('uploadProgressBar');
    const saveBtn = document.getElementById('saveBtn');
    progressWrap.style.display = 'block';
    progressBar.style.width = '0%';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Uploading image...';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    if (CLOUDINARY_FOLDER) formData.append('folder', CLOUDINARY_FOLDER);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const pct = Math.round((event.loaded / event.total) * 100);
        progressBar.style.width = pct + '%';
      }
    };

    xhr.onload = () => {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Product';
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        currentUploadedImage = { url: data.secure_url, publicId: data.public_id };
        resolve(currentUploadedImage);
      } else {
        const errData = JSON.parse(xhr.responseText || '{}');
        const message = (errData.error && errData.error.message) || 'Cloudinary upload failed';
        document.getElementById('formError').textContent = message;
        document.getElementById('formError').style.display = 'block';
        reject(new Error(message));
      }
    };

    xhr.onerror = () => {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Product';
      document.getElementById('formError').textContent = 'Network error while uploading the image.';
      document.getElementById('formError').style.display = 'block';
      reject(new Error('Network error'));
    };

    xhr.send(formData);
  });
}

async function saveProduct(e) {
  e.preventDefault();
  const errEl = document.getElementById('formError');
  errEl.style.display = 'none';

  const id = document.getElementById('productId').value;
  const code = document.getElementById('f_code').value.trim();
  const name = document.getElementById('f_name').value.trim();
  const material = document.getElementById('f_material').value;
  const type = document.getElementById('f_type').value;
  const badge = document.getElementById('f_badge').value.trim();
  const description = document.getElementById('f_description').value.trim();
  const active = document.getElementById('f_active').checked;

  if (!code || !name) {
    errEl.textContent = 'Product code and name are required.';
    errEl.style.display = 'block';
    return false;
  }

  const payload = {
    code, name, material, type, badge, description, active,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (currentUploadedImage) {
    payload.image = currentUploadedImage.url;
    payload.imagePublicId = currentUploadedImage.publicId;
  }

  const saveBtn = document.getElementById('saveBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    // enforce unique product code (mirrors the old backend's unique index)
    const dupe = products.find((p) => p.code === code && p.id !== id);
    if (dupe) {
      throw new Error('A product with this code already exists.');
    }

    if (id) {
      await db.collection('products').doc(id).update(payload);
    } else {
      payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('products').add(payload);
    }
    closeForm();
    await loadProducts();
  } catch (err) {
    console.error('Could not save product:', err);
    errEl.textContent = 'Could not save product: ' + err.message;
    errEl.style.display = 'block';
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Product';
  }
  return false;
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  try {
    await db.collection('products').doc(id).delete();
    await loadProducts();
  } catch (err) {
    console.error('Could not delete product:', err);
    alert('Could not delete product: ' + err.message);
  }
}
