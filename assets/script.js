// emCommerce Landing Page - script.js
// Meta Pixel: 2177371456363308

const PIXEL_ID = '2177371456363308';
const CAPI_ENDPOINT = '/api/capi'; // Cloudflare Worker endpoint
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
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : '';
}

// ===== CAPI SERVER-SIDE =====
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
  } catch (e) {
    // CAPI failure is non-critical, pixel still fires
  }
}

// ===== META PIXEL EVENTS =====
function trackInitiateCheckout(buttonId) {
  const eventId = generateEventId();
  // Client-side pixel
  if (typeof fbq === 'function') {
    fbq('track', 'InitiateCheckout', {
      content_name: 'Olshop Hack Premium',
      content_ids: ['olshop-hack-119'],
      currency: 'IDR',
      value: 119000,
    }, { eventID: eventId });
  }
  // Server-side CAPI
  sendCAPIEvent('InitiateCheckout', eventId, {
    content_name: 'Olshop Hack Premium',
    value: 119000,
    currency: 'IDR',
    button_id: buttonId
  });
}

// ===== CTA CLICK HANDLERS =====
function setupCTATracking() {
  const ctaIds = ['heroCta', 'navCta', 'solutionCta', 'valueCta', 'urgencyCta'];
  ctaIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', function(e) {
      window.ctaClicked = true;
      trackInitiateCheckout(id);
      // Allow natural navigation after pixel fires
    });
  });

  // Downsell CTA - track separately (no InitiateCheckout, different product)
  const downsellBtn = document.getElementById('downsellCta');
  if (downsellBtn) {
    downsellBtn.addEventListener('click', function() {
      if (typeof fbq === 'function') {
        fbq('trackCustom', 'DownsellClick', {
          content_name: 'Data 42000 Produk',
          value: 49000,
          currency: 'IDR'
        });
      }
    });
  }
}

// ===== VIEWCONTENT ON 50% SCROLL =====
function setupScrollTracking() {
  let viewContentFired = false;
  function onScroll() {
    if (viewContentFired) return;
    const scrolled = window.scrollY + window.innerHeight;
    const total = document.documentElement.scrollHeight;
    if (scrolled / total >= 0.5) {
      viewContentFired = true;
      if (typeof fbq === 'function') {
        fbq('track', 'ViewContent', {
          content_name: 'Olshop Hack Premium',
          content_ids: ['olshop-hack-119'],
          currency: 'IDR',
          value: 119000,
        });
      }
      window.removeEventListener('scroll', onScroll, { passive: true });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ===== STICKY NAV =====
function setupStickyNav() {
  const nav = document.getElementById('stickyNav');
  const hero = document.querySelector('.hero');
  if (!nav || !hero) return;

  function onScroll() {
    const heroBottom = hero.getBoundingClientRect().bottom;
    if (heroBottom < 0) {
      nav.classList.add('visible');
    } else {
      nav.classList.remove('visible');
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ===== FAQ ACCORDION =====
function setupFAQ() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-a');
    if (!btn || !ans) return;

    btn.addEventListener('click', function() {
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      // Close all
      items.forEach(i => {
        i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        i.querySelector('.faq-a').classList.remove('open');
      });

      // Open clicked if was closed
      if (!isOpen) {
        btn.setAttribute('aria-expanded', 'true');
        ans.classList.add('open');
      }
    });
  });
}

// ===== EXIT-INTENT POP-UP =====
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
    if (typeof fbq === 'function') {
      fbq('trackCustom', 'PromoPopupShown');
    }
  }

  function hidePopup() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  }

  // Scroll-based exit intent
  window.addEventListener('scroll', function() {
    const currentY = window.scrollY;
    const pct = getScrollPct();

    if (pct > maxScrollPct) maxScrollPct = pct;
    if (maxScrollPct >= 0.35) eligible = true;

    if (eligible && currentY < lastScrollY) {
      // Scrolling up
      if (upwardScrollStart === null) upwardScrollStart = lastScrollY;
      const upDelta = upwardScrollStart - currentY;
      if (upDelta >= 100) {
        const timeOnPage = (Date.now() - pageEntryTime) / 1000;
        if (timeOnPage >= 5) showPopup();
      }
    } else {
      upwardScrollStart = null;
    }

    lastScrollY = currentY;
  }, { passive: true });

  // Desktop: traditional mouse-leave exit intent (bonus)
  document.addEventListener('mouseleave', function(e) {
    if (e.clientY <= 0 && eligible) {
      const timeOnPage = (Date.now() - pageEntryTime) / 1000;
      if (timeOnPage >= 5) showPopup();
    }
  });

  // Close handlers
  closeBtn && closeBtn.addEventListener('click', hidePopup);
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) hidePopup();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hidePopup();
  });

  // Copy code
  copyBtn && copyBtn.addEventListener('click', function() {
    const code = 'APRILSALE';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(function() {
        copyBtn.textContent = 'Kode Disalin!';
        if (typeof fbq === 'function') {
          fbq('trackCustom', 'PromoCodeCopied', { promo_code: code, discount: '30%' });
        }
        setTimeout(hidePopup, 1000);
      }).catch(function() {
        // Fallback
        const box = document.getElementById('promoCodeBox');
        if (box) {
          const range = document.createRange();
          range.selectNodeContents(box);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }
        copyBtn.textContent = 'Salin kode di atas';
      });
    } else {
      // Fallback for older browsers
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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  setupCTATracking();
  setupScrollTracking();
  setupStickyNav();
  setupFAQ();
  setupExitIntent();
});
