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

// ===== INIT =====
document.addEventListener('DOMContentLoaded', function() {
  setupCTATracking();
  setupScrollTracking();
  setupStickyNav();
  setupFAQ();
});
