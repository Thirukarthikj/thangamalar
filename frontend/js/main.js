/* ═══════════════════════════════════════════════════════════════
   THANGAMALAR JEWELLERS — FRONTEND LOGIC
   Data source: Firebase Firestore ("products" collection)
   Images: Cloudinary URLs stored on each product document
═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════
   NAVIGATION
═══════════════════════════════════════ */
var currentPage = 'home';

function navigate(page) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    a.classList.toggle('active', a.dataset.page === page);
  });
  currentPage = page;
  window.scrollTo(0, 0);
  document.getElementById('navLinks').classList.remove('mobile-open');
  setTimeout(initFadeUps, 100);
  if (page === 'catalog' && !productsLoaded) {
    loadProductsFromFirestore();
  }
}

function toggleMobileMenu() {
  document.getElementById('navLinks').classList.toggle('mobile-open');
}

window.addEventListener('scroll', function () {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 50);
});

/* ═══════════════════════════════════════
   FADE-UP ANIMATIONS
═══════════════════════════════════════ */
function initFadeUps() {
  var els = document.querySelectorAll('.page.active .fade-up');
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { obs.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('visible'); });
  }
}
setTimeout(initFadeUps, 200);

/* ═══════════════════════════════════════
   TESTIMONIALS SLIDER
═══════════════════════════════════════ */
var testiIndex = 0;
var testiTimer;

function goTesti(i) {
  var cards = document.querySelectorAll('.testi-card');
  var dots = document.querySelectorAll('.testi-dot');
  cards.forEach(function (c) { c.classList.remove('active'); });
  dots.forEach(function (d) { d.classList.remove('active'); });
  testiIndex = i;
  cards[i].classList.add('active');
  dots[i].classList.add('active');
  clearTimeout(testiTimer);
  testiTimer = setTimeout(function () { goTesti((testiIndex + 1) % cards.length); }, 5000);
}
testiTimer = setTimeout(function () { goTesti(1); }, 5000);

/* ═══════════════════════════════════════
   WHATSAPP ENQUIRY
═══════════════════════════════════════ */
var WHATSAPP_NUMBER = '919342553805';

function sendToWhatsApp(message) {
  window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message), '_blank');
}

/* ═══════════════════════════════════════
   PRODUCT CATALOG (backed by Firestore)
   Each product document looks like:
   {
     code, name, material, type, description, badge,
     image: "https://res.cloudinary.com/.../upload/.../xyz.jpg",
     active: true
   }
═══════════════════════════════════════ */
var allProducts = [];
var productsLoaded = false;
var PLACEHOLDER_IMG = 'images/placeholder.jpg';

// Ask Cloudinary to hand back a lightweight, cropped thumbnail instead of
// the full-size original, purely by editing the URL — no extra requests.
function cloudinaryThumb(url, width) {
  if (!url || typeof url !== 'string') return PLACEHOLDER_IMG;
  if (url.indexOf('res.cloudinary.com') === -1 || url.indexOf('/upload/') === -1) return url;
  var w = width || 500;
  return url.replace('/upload/', '/upload/f_auto,q_auto,c_fill,w_' + w + '/');
}

function escapeHtmlCat(str) {
  var div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function renderProductCard(p) {
  var badge = p.badge ? '<span class="product-badge">' + escapeHtmlCat(p.badge) + '</span>' : '';
  var thumb = cloudinaryThumb(p.image, 500);
  var full = p.image || PLACEHOLDER_IMG;
  return '' +
    '<div class="product-card" data-material="' + p.material + '" data-type="' + p.type + '">' +
      '<div class="product-img">' + badge + '<img src="' + thumb + '" alt="' + escapeHtmlCat(p.name) + '" loading="lazy" onerror="this.onerror=null;this.src=\'' + PLACEHOLDER_IMG + '\'"></div>' +
      '<div class="product-info"><div class="product-code">' + escapeHtmlCat(p.code) + '</div><div class="product-name">' + escapeHtmlCat(p.name) + '</div><div class="product-desc">' + escapeHtmlCat(p.description || '') + '</div></div>' +
      '<div class="product-footer"><button class="btn-enquire" onclick="openEnquiry(this, event)" data-code="' + escapeHtmlCat(p.code) + '" data-name="' + escapeHtmlCat(p.name) + '" data-img="' + full + '">Enquire Now</button></div>' +
    '</div>';
}

function loadProductsFromFirestore() {
  var grid = document.getElementById('catGrid');
  return db.collection('products')
    .where('active', '==', true)
    .get()
    .then(function (snapshot) {
      allProducts = snapshot.docs.map(function (doc) {
        var data = doc.data();
        data.id = doc.id;
        return data;
      });
      // newest first, same ordering as the original site
      allProducts.sort(function (a, b) {
        var at = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        var bt = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return bt - at;
      });
      productsLoaded = true;
      filterProducts();
    })
    .catch(function (err) {
      grid.innerHTML = '<div class="cat-empty"><div class="section-title">Could not load products</div><p>Please check your connection or try again shortly.</p></div>';
      console.error('Failed to load products from Firestore:', err);
    });
}

function filterProducts() {
  var grid = document.getElementById('catGrid');
  if (!productsLoaded) {
    // still loading — kick off the fetch (first call) and bail; it will
    // call filterProducts() again once data arrives.
    loadProductsFromFirestore();
    return;
  }
  var searchVal = document.getElementById('catSearch').value.toLowerCase();
  var material = document.getElementById('materialFilter').value;
  var type = document.getElementById('typeFilter').value;

  var filtered = allProducts.filter(function (p) {
    var matMatch = material === 'all' || p.material === material;
    var typeMatch = type === 'all' || p.type === type;
    var searchMatch = !searchVal ||
      (p.name && p.name.toLowerCase().indexOf(searchVal) !== -1) ||
      (p.code && p.code.toLowerCase().indexOf(searchVal) !== -1);
    return matMatch && typeMatch && searchMatch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="cat-empty" id="catEmptyMsg"><div class="section-title">No Results</div><p>Try a different search or filter.</p></div>';
  } else {
    grid.innerHTML = filtered.map(renderProductCard).join('');
  }
}

function filterCatalog(category) {
  navigate('catalog');
  setTimeout(function () {
    var sel = document.getElementById('materialFilter');
    if (sel) sel.value = category;
    filterProducts();
  }, 100);
}

/* ═══════════════════════════════════════
   ENQUIRY MODAL
═══════════════════════════════════════ */
function openEnquiry(btn, e) {
  var code = btn.dataset.code;
  var name = btn.dataset.name;
  var img = btn.dataset.img;
  document.getElementById('modalName').textContent = name;
  document.getElementById('modalCode').textContent = code;
  document.getElementById('modalThumb').src = cloudinaryThumb(img, 300);
  document.getElementById('modalThumb').alt = name;
  document.getElementById('m-name').value = '';
  document.getElementById('m-phone').value = '';
  document.getElementById('m-email').value = '';
  document.getElementById('m-msg').value = '';
  document.getElementById('modalSuccess').classList.remove('show');
  document.getElementById('enquiryModal').classList.add('open');
  document.body.style.overflow = 'hidden';
  if (e) e.stopPropagation();
}

function closeEnquiryModal() {
  document.getElementById('enquiryModal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeModal(e) {
  if (e.target === document.getElementById('enquiryModal')) {
    closeEnquiryModal();
  }
}

/* ═══════════════════════════════════════
   IMAGE PREVIEW (CATALOG)
═══════════════════════════════════════ */
function openImagePreview(imgEl) {
  var card = imgEl.closest('.product-card');
  var name = card ? card.querySelector('.product-name') : null;
  document.getElementById('imgPreviewSrc').src = imgEl.src;
  document.getElementById('imgPreviewSrc').alt = imgEl.alt;
  document.getElementById('imgPreviewCaption').textContent = name ? name.textContent : imgEl.alt;
  document.getElementById('imgPreviewModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeImagePreview(e) {
  if (e && e.target !== document.getElementById('imgPreviewModal')) return;
  document.getElementById('imgPreviewModal').classList.remove('open');
  document.body.style.overflow = '';
}

document.addEventListener('click', function (e) {
  var imgWrap = e.target.closest('.product-img');
  if (imgWrap) {
    var img = imgWrap.querySelector('img');
    if (img) openImagePreview(img);
  }
});

function submitEnquiry() {
  var name = document.getElementById('m-name').value.trim();
  var phone = document.getElementById('m-phone').value.trim();
  var email = document.getElementById('m-email').value.trim();
  var msg = document.getElementById('m-msg').value.trim();
  if (!name || !phone) { alert('Please enter your name and phone number.'); return; }
  var productName = document.getElementById('modalName').textContent;
  var productCode = document.getElementById('modalCode').textContent;

  // Best-effort record in Firestore so nothing is lost even if the
  // customer closes WhatsApp before sending. Never blocks the WhatsApp flow.
  db.collection('enquiries').add({
    type: 'product',
    productName: productName,
    productCode: productCode,
    name: name,
    phone: phone,
    email: email,
    message: msg,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function (err) { console.error('Could not save enquiry:', err); });

  var waMessage = 'New Enquiry — Thangamalar Jewellers\n\n' +
    'Product: ' + productName + ' (' + productCode + ')\n' +
    'Name: ' + name + '\n' +
    'Phone: ' + phone + '\n' +
    (email ? 'Email: ' + email + '\n' : '') +
    (msg ? 'Message: ' + msg : '');
  sendToWhatsApp(waMessage);
  document.getElementById('modalSuccess').classList.add('show');
  setTimeout(function () { closeEnquiryModal(); }, 2500);
}

/* ═══════════════════════════════════════
   CONTACT FORM
═══════════════════════════════════════ */
function submitContactForm() {
  var name = document.getElementById('cf-name').value.trim();
  var email = document.getElementById('cf-email').value.trim();
  var phone = document.getElementById('cf-phone').value.trim();
  var msg = document.getElementById('cf-msg').value.trim();
  if (!name || !email) { alert('Please enter your name and email address.'); return; }

  db.collection('enquiries').add({
    type: 'contact',
    name: name,
    email: email,
    phone: phone,
    message: msg,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).catch(function (err) { console.error('Could not save enquiry:', err); });

  var waMessage = 'New Enquiry — Thangamalar Jewellers (Contact Page)\n\n' +
    'Name: ' + name + '\n' +
    'Email: ' + email + '\n' +
    (phone ? 'Phone: ' + phone + '\n' : '') +
    (msg ? 'Message: ' + msg : '');
  sendToWhatsApp(waMessage);
  document.getElementById('formSuccess').classList.add('show');
  document.getElementById('cf-name').value = '';
  document.getElementById('cf-email').value = '';
  document.getElementById('cf-phone').value = '';
  document.getElementById('cf-msg').value = '';
}

function subscribeNewsletter() {
  var fields = ['footerEmail', 'collEmail', 'catEmail', 'ctEmail'];
  var email = '';
  for (var i = 0; i < fields.length; i++) {
    var el = document.getElementById(fields[i]);
    if (el && el.value.trim()) { email = el.value.trim(); break; }
  }
  if (!email) { alert('Please enter your email address.'); return; }

  db.collection('newsletter').add({
    email: email,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(function () {
    alert('Thank you for subscribing to Thangamalar Jewellers!');
  }).catch(function (err) {
    console.error('Could not save subscription:', err);
    alert('Thank you for subscribing to Thangamalar Jewellers!');
  });

  fields.forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
}

window.addEventListener('load', function () {
  initFadeUps();
});

document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeEnquiryModal();
    closeImagePreview({ target: document.getElementById('imgPreviewModal') });
  }
});
