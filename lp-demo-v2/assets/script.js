// emCommerce Landing Page - script.js (lp-demo-v2)
// Meta Pixel: 2177371456363308

const PIXEL_ID = '2177371456363308';
const CAPI_ENDPOINT = '/api/capi';
const LYNK_PRIMARY = 'https://lynk.id/emcommerce/BORXZyd';

// ===== UTILITY =====
function generateEventId() {
  return 'emc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
function getUserData() {
  return {
    client_user_agent: navigator.userAgent,
    fbc: getCookie('_fbc') || '',
    fbp: getCookie('_fbp') || '',
  };
}
function getCookie(name) {
  const m = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return m ? m[2] : '';
}

// ===== CAPI =====
async function sendCAPIEvent(eventName, eventId, extraData = {}) {
  try {
    await fetch(CAPI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_id: eventId,
        event_source_url: window.location.href,
        user_data: getUserData(),
        ...extraData
      })
    });
  } catch (e) { /* non-critical */ }
}

// ===== META PIXEL EVENTS =====
function trackInitiateCheckout(buttonId) {
  const eventId = generateEventId();
  if (typeof fbq === 'function') {
    fbq('track', 'InitiateCheckout', {
      content_name: 'Olshop Hack Premium',
      content_ids: ['olshop-hack-119'],
      currency: 'IDR',
      value: 119000,
    }, { eventID: eventId });
  }
  sendCAPIEvent('InitiateCheckout', eventId, {
    content_name: 'Olshop Hack Premium',
    value: 119000,
    currency: 'IDR',
    button_id: buttonId
  });
}

function trackProductClick(productId) {
  if (typeof fbq === 'function') {
    fbq('trackCustom', 'ProductClick', { product_id: productId });
  }
}

// ===== CTA TRACKING =====
function setupCTATracking() {
  const heroCta = document.getElementById('heroCta');
  if (heroCta) {
    heroCta.addEventListener('click', function() {
      const gridSection = document.querySelector('[aria-label="50 Hidden Gems"]');
      if (gridSection) gridSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
  const ctaIds = ['navCta', 'paywallCta', 'valueCta'];
  ctaIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function() {
      window.ctaClicked = true;
      trackInitiateCheckout(id);
    });
  });
  const downsellBtn = document.getElementById('downsellCta');
  if (downsellBtn) {
    downsellBtn.addEventListener('click', function() {
      if (typeof fbq === 'function') {
        fbq('trackCustom', 'DownsellClick', { content_name: 'Data 42000 Produk', value: 49000, currency: 'IDR' });
      }
    });
  }
}

// ===== SCROLL TRACKING =====
function setupScrollTracking() {
  let viewContentFired = false;
  let demoDepthFired = false;
  window.addEventListener('scroll', function onScroll() {
    const scrolled = window.scrollY + window.innerHeight;
    const total = document.documentElement.scrollHeight;
    const pct = scrolled / total;
    if (!viewContentFired && pct >= 0.5) {
      viewContentFired = true;
      if (typeof fbq === 'function') {
        fbq('track', 'ViewContent', {
          content_name: 'Olshop Hack Premium',
          content_ids: ['olshop-hack-119'],
          currency: 'IDR',
          value: 119000,
        });
      }
    }
    if (!demoDepthFired && pct >= 0.75) {
      demoDepthFired = true;
      if (typeof fbq === 'function') fbq('trackCustom', 'DemoScrollDepth_75');
    }
    if (viewContentFired && demoDepthFired) window.removeEventListener('scroll', onScroll);
  }, { passive: true });
}

// ===== STICKY NAV =====
function setupStickyNav() {
  const nav = document.getElementById('stickyNav');
  const hero = document.querySelector('.hero');
  if (!nav || !hero) return;
  window.addEventListener('scroll', function() {
    nav.classList.toggle('visible', hero.getBoundingClientRect().bottom < 0);
  }, { passive: true });
}

// ===== FAQ =====
function setupFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-a');
    if (!btn || !ans) return;
    btn.addEventListener('click', function() {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.faq-q').forEach(b => b.setAttribute('aria-expanded', 'false'));
      document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        ans.classList.add('open');
      }
    });
  });
}

// ===== EXIT-INTENT POPUP =====
function setupExitIntent() {
  const overlay = document.getElementById('promoOverlay');
  const closeBtn = document.getElementById('promoClose');
  const copyBtn = document.getElementById('promoCopyBtn');
  if (!overlay) return;
  const SESSION_KEY = 'emc_popup_shown';
  if (sessionStorage.getItem(SESSION_KEY)) return;

  let pageEntryTime = Date.now();
  let maxScrollPct = 0;
  let lastScrollY = window.scrollY;
  let upwardScrollStart = null;
  let eligible = false;

  function getScrollPct() {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    return total > 0 ? window.scrollY / total : 0;
  }
  function showPopup() {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (window.ctaClicked) return;
    sessionStorage.setItem(SESSION_KEY, '1');
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    if (typeof fbq === 'function') fbq('trackCustom', 'PromoPopupShown');
  }
  function hidePopup() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  }
  window.addEventListener('scroll', function() {
    const currentY = window.scrollY;
    const pct = getScrollPct();
    if (pct > maxScrollPct) maxScrollPct = pct;
    if (maxScrollPct >= 0.15) eligible = true;
    if (eligible && currentY < lastScrollY) {
      if (upwardScrollStart === null) upwardScrollStart = lastScrollY;
      if ((upwardScrollStart - currentY) >= 100 && (Date.now() - pageEntryTime) / 1000 >= 3) showPopup();
    } else { upwardScrollStart = null; }
    lastScrollY = currentY;
  }, { passive: true });
  document.addEventListener('mouseleave', function(e) {
    if (e.clientY <= 0 && eligible && (Date.now() - pageEntryTime) / 1000 >= 3) showPopup();
  });
  closeBtn && closeBtn.addEventListener('click', hidePopup);
  overlay.addEventListener('click', function(e) { if (e.target === overlay) hidePopup(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') hidePopup(); });
  copyBtn && copyBtn.addEventListener('click', function() {
    const code = 'APRILSALE';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function() {
        copyBtn.textContent = 'Kode Disalin! ✓';
        if (typeof fbq === 'function') fbq('trackCustom', 'PromoCodeCopied', { promo_code: code, discount: '30%' });
        setTimeout(hidePopup, 1200);
      }).catch(fallbackCopy);
    } else { fallbackCopy(); }
    function fallbackCopy() {
      const box = document.getElementById('promoCodeBox');
      if (box) {
        const range = document.createRange();
        range.selectNodeContents(box);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      copyBtn.textContent = 'Salin kode di atas';
    }
  });
}

// ===== PRODUCT GRID =====
const LOAD_TIERS = [6, 16, 30, 50];

function setupProductGrid(products) {
  const grid = document.getElementById('productGrid');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (!grid || !products) return;

  // FIX 1: Use a Map for O(1) lookup instead of .some() loop
  let filteredIds = new Set(products.map(p => p.id));
  let visibleCount = 0;
  let allFiltered = products;

  // FIX 2: Build cards with CSS class hidden, not style.display
  // This avoids style recalc on every show/hide
  const fragment = document.createDocumentFragment();
  products.forEach(p => {
    const card = buildCard(p);
    card.classList.add('card-hidden');
    fragment.appendChild(card);
  });
  grid.appendChild(fragment); // Single DOM write

  function getNextTier(current, total) {
    return LOAD_TIERS.find(t => t > current && t <= total) || total;
  }

  // FIX 3: Batch all DOM reads first, then writes (avoid layout thrashing)
  function renderVisible(filtered, count) {
    const filteredSet = new Set(filtered.map(p => String(p.id)));
    const allCards = grid.querySelectorAll('.product-card');

    // Single requestAnimationFrame to batch all DOM writes
    requestAnimationFrame(() => {
      let shown = 0;
      allCards.forEach(card => {
        const inFilter = filteredSet.has(card.dataset.id);
        const shouldShow = inFilter && shown < count;
        card.classList.toggle('card-hidden', !shouldShow);
        if (!shouldShow) card.classList.remove('expanded');
        if (shouldShow) shown++;
      });
    });
  }

  function updateLoadMoreBtn(filtered, count) {
    if (!loadMoreBtn) return;
    if (count >= filtered.length) {
      loadMoreBtn.style.display = 'none';
      return;
    }
    const nextTier = getNextTier(count, filtered.length);
    loadMoreBtn.textContent = 'Lihat ' + (nextTier - count) + ' lagi';
    loadMoreBtn.style.display = '';
  }

  function applyFilter(categorySlug) {
    collapseAll();
    allFiltered = categorySlug === 'semua'
      ? products
      : products.filter(p => p.kategori_slug === categorySlug);
    visibleCount = Math.min(6, allFiltered.length);
    renderVisible(allFiltered, visibleCount);
    updateLoadMoreBtn(allFiltered, visibleCount);
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      const nextTier = getNextTier(visibleCount, allFiltered.length);
      visibleCount = nextTier;
      renderVisible(allFiltered, visibleCount);
      updateLoadMoreBtn(allFiltered, visibleCount);
      if (typeof fbq === 'function') {
        if (visibleCount >= 50) fbq('trackCustom', 'ExpandProducts_50');
        else if (visibleCount >= 30) fbq('trackCustom', 'ExpandProducts_30');
        else if (visibleCount >= 16) fbq('trackCustom', 'ExpandProducts_16');
      }
    });
  }

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      applyFilter(this.dataset.cat);
    });
  });

  applyFilter('semua');
}

function collapseAll() {
  document.querySelectorAll('.product-card.expanded').forEach(c => c.classList.remove('expanded'));
}

function buildCard(p) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.dataset.id = p.id;
  card.dataset.category = p.kategori_slug;

  card.innerHTML = `
    <p class="card-category">${escHtml(p.kategori)}</p>
    <p class="card-name">${escHtml(p.nama_short)}</p>
    <div class="card-price-row">
      <span class="card-price-label">Harga</span>
      <span class="card-price">${escHtml(p.harga_display)}</span>
    </div>
    <div class="card-omset-row">
      <span class="card-omset-label">Omset</span>
      <span class="card-omset">${escHtml(p.omset_display)}/bln</span>
    </div>
    <div class="card-footer">
      <span>${formatNum(p.terjual_bulan)} terjual</span>
      <span class="card-footer-rating">★ ${escHtml(p.rating)}</span>
    </div>
    <div class="card-expanded-content">
      <div class="card-detail-row">
        <span class="card-detail-label">Toko</span>
        <span>${escHtml(p.nama_toko)}</span>
      </div>
      <div class="card-detail-row">
        <span class="card-detail-label">Lokasi</span>
        <span>${escHtml(p.lokasi)}</span>
      </div>
      <div class="card-detail-row">
        <span class="card-detail-label">Ulasan</span>
        <span>${formatNum(p.ulasan)} ulasan</span>
      </div>
      <p class="card-nudge">Cara cari supplier dan pricing-nya ada di eBook.</p>
      <div class="card-actions">
        <a href="${escHtml(p.shopee_search_url)}"
           class="card-btn-shopee"
           target="_blank"
           rel="noopener noreferrer sponsored"
           onclick="trackProductClick(${p.id})">Lihat di Shopee ↗</a>
        <button class="card-btn-close" data-close="${p.id}">Tutup</button>
      </div>
    </div>
  `;

  card.addEventListener('click', function(e) {
    if (e.target.closest('a') || e.target.closest('[data-close]')) return;
    const isExpanded = card.classList.contains('expanded');
    collapseAll();
    if (!isExpanded) {
      card.classList.add('expanded');
      // FIX 4: Use scrollIntoView inside rAF to avoid forced reflow (was line 171)
      requestAnimationFrame(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  });

  card.addEventListener('click', function(e) {
    if (e.target.closest('[data-close]')) card.classList.remove('expanded');
  });

  return card;
}

function escHtml(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatNum(n) {
  return Number(n).toLocaleString('id-ID');
}

// ===== INIT =====
// FIX 5: Use requestIdleCallback so product grid load doesn't compete with paint
document.addEventListener('DOMContentLoaded', function() {
  // These are lightweight, run immediately
  setupCTATracking();
  setupScrollTracking();
  setupStickyNav();
  setupFAQ();
  setupExitIntent();

  // Product grid is below fold — load during idle time to not block main thread
  const loadGrid = async () => {
    try {
      const res = await fetch('./assets/products_data.json');
      const products = await res.json();
      setupProductGrid(products);
    } catch(e) {
      console.warn('Could not load products_data.json', e);
    }
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadGrid, { timeout: 2000 });
  } else {
    setTimeout(loadGrid, 200);
  }
});
